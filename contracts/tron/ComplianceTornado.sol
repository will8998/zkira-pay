// SPDX-License-Identifier: MIT
pragma solidity ^0.7.0;

import "./MerkleTreeWithHistory.sol";
import "./interfaces/IVerifier.sol";
import "./interfaces/ISanctionsOracle.sol";

/**
 * @title ComplianceTornado
 * @dev Base mixer contract with built-in compliance checks (sanctions oracle + blocklist)
 * and protocol fee system.
 * Replaces the original Tornado.sol with added deposit-side compliance for regulatory requirements.
 * Withdrawal side preserves privacy for legitimate users, with on-chain fee deductions.
 *
 * Fee architecture:
 * - Protocol fee (up to 5%): deducted on withdrawal, sent to treasury
 * - Relayer fee: standard Tornado Cash relayer fee (part of ZK proof)
 */
abstract contract ComplianceTornado is MerkleTreeWithHistory {
  // === Tornado Cash original state ===
  IVerifier public immutable verifier;
  uint256 public denomination;
  mapping(bytes32 => bool) public nullifierHashes;
  mapping(bytes32 => bool) public commitments;

  // === Compliance additions ===
  address public owner;
  ISanctionsOracle public sanctionsOracle;
  mapping(address => bool) public blocklist;
  bool public paused;

  // === Protocol Fee ===
  uint256 public protocolFeeBps; // e.g., 100 = 1%
  address public treasury; // Where protocol fees go

  uint256 public totalProtocolFees; // Track total protocol fees collected

  // === Reentrancy guard (inlined, no OpenZeppelin dependency) ===
  uint256 private _status = 1;
  modifier nonReentrant() {
    require(_status != 2, "ReentrancyGuard: reentrant call");
    _status = 2;
    _;
    _status = 1;
  }

  // === Events ===
  event Deposit(bytes32 indexed commitment, uint32 leafIndex, uint256 timestamp);
  event Withdrawal(address to, bytes32 nullifierHash, address indexed relayer, uint256 fee);
  event BlocklistUpdated(address indexed addr, bool blocked);
  event SanctionsOracleUpdated(address indexed newOracle);
  event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);
  event Paused(bool isPaused);

  // === Protocol Fee Events ===
  event ProtocolFeeUpdated(uint256 oldFeeBps, uint256 newFeeBps);
  event TreasuryUpdated(address indexed oldTreasury, address indexed newTreasury);
  event ProtocolFeePayment(address indexed treasury, uint256 amount);

  modifier onlyOwner() {
    require(msg.sender == owner, "Not owner");
    _;
  }

  modifier whenNotPaused() {
    require(!paused, "Pool is paused");
    _;
  }

  constructor(
    IVerifier _verifier,
    IHasher _hasher,
    uint256 _denomination,
    uint32 _merkleTreeHeight,
    ISanctionsOracle _sanctionsOracle,
    uint256 _protocolFeeBps,
    address _treasury
  ) MerkleTreeWithHistory(_merkleTreeHeight, _hasher) {
    require(_denomination > 0, "denomination should be greater than 0");
    require(_protocolFeeBps <= 500, "Protocol fee cannot exceed 5%");
    require(_treasury != address(0), "Treasury cannot be zero address");
    verifier = _verifier;
    denomination = _denomination;
    sanctionsOracle = _sanctionsOracle;
    owner = msg.sender;
    protocolFeeBps = _protocolFeeBps;
    treasury = _treasury;
  }

  // === DEPOSIT: with sanctions + blocklist check ===
  /**
   * @dev Deposit funds into the mixer. Compliance checks are enforced:
   * 1. Sanctions oracle check (if oracle is set)
   * 2. Local blocklist check
   * @param _commitment the note commitment = Pedersen(nullifier + secret)
   */
  function deposit(bytes32 _commitment) external payable nonReentrant whenNotPaused {
    require(!commitments[_commitment], "The commitment has been submitted");

    // COMPLIANCE CHECK 1: Sanctions oracle
    if (address(sanctionsOracle) != address(0)) {
      require(!sanctionsOracle.isSanctioned(msg.sender), "Depositor is sanctioned");
    }

    // COMPLIANCE CHECK 2: Local blocklist
    require(!blocklist[msg.sender], "Depositor is blocked");

    uint32 insertedIndex = _insert(_commitment);
    commitments[_commitment] = true;
    _processDeposit();

    emit Deposit(_commitment, insertedIndex, block.timestamp);
  }

  /** @dev this function is defined in a child contract */
  function _processDeposit() internal virtual;

  // === WITHDRAWAL ===
  /**
   * @dev Withdraw a deposit from the mixer. `proof` is a zkSNARK proof data, and input is an array of circuit public inputs.
   * `input` array consists of:
   *   - merkle root of all deposits in the mixer
   *   - hash of unique deposit nullifier to prevent double spends
   *   - the recipient of funds
   *   - optional fee that goes to the transaction sender (usually a relay)
   */
  function withdraw(
    bytes calldata _proof,
    bytes32 _root,
    bytes32 _nullifierHash,
    address payable _recipient,
    address payable _relayer,
    uint256 _fee,
    uint256 _refund
  ) external payable nonReentrant whenNotPaused {
    require(_fee <= denomination, "Fee exceeds transfer value");
    require(!nullifierHashes[_nullifierHash], "The note has been already spent");
    require(isKnownRoot(_root), "Cannot find your merkle root");

    // Verify proof with original 6 public inputs
    require(
      verifier.verifyProof(
        _proof,
        [uint256(_root), uint256(_nullifierHash), uint256(uint160(address(_recipient))), uint256(uint160(address(_relayer))), _fee, _refund]
      ),
      "Invalid withdraw proof"
    );

    nullifierHashes[_nullifierHash] = true;
    _processWithdraw(_recipient, _relayer, _fee, _refund, _nullifierHash);
    emit Withdrawal(_recipient, _nullifierHash, _relayer, _fee);
  }

  /** @dev this function is defined in a child contract */
  function _processWithdraw(
    address payable _recipient,
    address payable _relayer,
    uint256 _fee,
    uint256 _refund,
    bytes32 _nullifierHash
  ) internal virtual;

  // === COMPLIANCE: Admin functions ===

  /** @dev Add or remove an address from the local blocklist */
  function updateBlocklist(address _addr, bool _blocked) external onlyOwner {
    blocklist[_addr] = _blocked;
    emit BlocklistUpdated(_addr, _blocked);
  }

  /** @dev Batch update the local blocklist */
  function updateBlocklistBatch(address[] calldata _addrs, bool _blocked) external onlyOwner {
    for (uint256 i = 0; i < _addrs.length; i++) {
      blocklist[_addrs[i]] = _blocked;
    }
  }

  /** @dev Update the sanctions oracle address (can be set to address(0) to disable) */
  function updateSanctionsOracle(ISanctionsOracle _newOracle) external onlyOwner {
    sanctionsOracle = _newOracle;
    emit SanctionsOracleUpdated(address(_newOracle));
  }

  /** @dev Pause or unpause deposits and withdrawals */
  function setPaused(bool _paused) external onlyOwner {
    paused = _paused;
    emit Paused(_paused);
  }

  /** @dev Transfer ownership of the contract */
  function transferOwnership(address _newOwner) external onlyOwner {
    require(_newOwner != address(0), "New owner is zero address");
    emit OwnershipTransferred(owner, _newOwner);
    owner = _newOwner;
  }

  // === PROTOCOL FEE MANAGEMENT ===

  function setProtocolFee(uint256 _newFeeBps) external onlyOwner {
    require(_newFeeBps <= 500, "Protocol fee cannot exceed 5%");
    uint256 oldFee = protocolFeeBps;
    protocolFeeBps = _newFeeBps;
    emit ProtocolFeeUpdated(oldFee, _newFeeBps);
  }

  function setTreasury(address _newTreasury) external onlyOwner {
    require(_newTreasury != address(0), "Treasury cannot be zero address");
    address oldTreasury = treasury;
    treasury = _newTreasury;
    emit TreasuryUpdated(oldTreasury, _newTreasury);
  }


  // === VIEW FUNCTIONS ===

  /** @dev whether a note is already spent */
  function isSpent(bytes32 _nullifierHash) public view returns (bool) {
    return nullifierHashes[_nullifierHash];
  }

  /** @dev whether an array of notes is already spent */
  function isSpentArray(bytes32[] calldata _nullifierHashes) external view returns (bool[] memory spent) {
    spent = new bool[](_nullifierHashes.length);
    for (uint256 i = 0; i < _nullifierHashes.length; i++) {
      if (isSpent(_nullifierHashes[i])) {
        spent[i] = true;
      }
    }
  }

  /** @dev Check if an address is blocked by either the sanctions oracle or local blocklist */
  function isBlocked(address _addr) public view returns (bool) {
    if (address(sanctionsOracle) != address(0) && sanctionsOracle.isSanctioned(_addr)) {
      return true;
    }
    return blocklist[_addr];
  }

  /** @dev Calculate protocol fee for a withdrawal */
  function calculateFees() external view returns (uint256 protocolFee) {
    protocolFee = (denomination * protocolFeeBps) / 10000;
  }
}
