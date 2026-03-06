// SPDX-License-Identifier: MIT
pragma solidity ^0.7.0;

import "./ComplianceTornado.sol";
import "./interfaces/ISanctionsOracle.sol";
import "./interfaces/IUSDT.sol";

/**
 * @title USDTPool
 * @dev TRC-20 USDT privacy pool with triple-layer compliance + protocol fee.
 * 1. Sanctions oracle check (external, e.g. OFAC list)
 * 2. Local blocklist (owner-managed)
 * 3. Tether's own blacklist (on-chain, checked via isBlackListed)
 *
 * Denomination is in USDT's 6-decimal format:
 *   10 USDT   = 10_000_000
 *   100 USDT  = 100_000_000
 *   1000 USDT = 1_000_000_000
 *
 * Deployment: SanctionsOracle → Verifier → Hasher → USDTPool (per denomination)
 * USDT on Tron: TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t
 */
contract USDTPool is ComplianceTornado {
  IUSDT public token;

  constructor(
    IVerifier _verifier,
    IHasher _hasher,
    uint256 _denomination,
    uint32 _merkleTreeHeight,
    IUSDT _token,
    ISanctionsOracle _sanctionsOracle,
    uint256 _protocolFeeBps,
    address _treasury
  ) ComplianceTornado(_verifier, _hasher, _denomination, _merkleTreeHeight, _sanctionsOracle, _protocolFeeBps, _treasury) {
    token = _token;
  }

  function _processDeposit() internal override {
    require(msg.value == 0, "ETH value is supposed to be 0 for TRC20 instance");

    // COMPLIANCE CHECK 3: Tether's own blacklist
    require(!token.isBlackListed(msg.sender), "Depositor is Tether-blacklisted");

    // COMPLIANCE CHECK 4: Pool itself not blacklisted (Tether can freeze contract addresses)
    require(!token.isBlackListed(address(this)), "Pool is Tether-blacklisted");

    token.transferFrom(msg.sender, address(this), denomination);
  }

  function _processWithdraw(
    address payable _recipient,
    address payable _relayer,
    uint256 _fee,
    uint256 _refund,
    bytes32 _nullifierHash
  ) internal override {
    require(msg.value == _refund, "Incorrect refund amount received by the contract");

    // Calculate protocol fee
    uint256 protocolFee = (denomination * protocolFeeBps) / 10000;

    uint256 totalDeductions = _fee + protocolFee;
    require(totalDeductions <= denomination, "Total fees exceed denomination");

    uint256 recipientAmount = denomination - totalDeductions;
    require(recipientAmount > 0, "Recipient would receive nothing");

    // Transfer to recipient (USDT void return — no require wrapper)
    token.transfer(_recipient, recipientAmount);

    // Transfer relayer fee
    if (_fee > 0) {
      token.transfer(_relayer, _fee);
    }

    // Transfer protocol fee to treasury
    if (protocolFee > 0) {
      token.transfer(treasury, protocolFee);
      totalProtocolFees += protocolFee;
      emit ProtocolFeePayment(treasury, protocolFee);
    }

    // Handle TRX refund (usually 0)
    if (_refund > 0) {
      (bool success, ) = _recipient.call{ value: _refund }("");
      if (!success) {
        // if TRX refund to recipient fails, send to relayer instead
        _relayer.transfer(_refund);
      }
    }
  }
}
