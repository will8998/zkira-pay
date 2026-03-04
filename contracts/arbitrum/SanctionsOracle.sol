// SPDX-License-Identifier: MIT
pragma solidity ^0.7.0;

import "./interfaces/ISanctionsOracle.sol";

/**
 * @title SanctionsOracle
 * @dev Owner-managed sanctions list for testnet/fallback deployment.
 * On Arbitrum mainnet, use the Chainalysis oracle at 0x40C57923924B5c5c5455c48D93317139ADDaC8fb.
 * This contract is deployed on testnets where Chainalysis is not available.
 *
 * The owner should maintain this list based on OFAC SDN list and
 * other relevant sanctions databases. Can be updated in batch.
 */
contract SanctionsOracle is ISanctionsOracle {
  address public owner;
  mapping(address => bool) private sanctioned;

  event SanctionAdded(address indexed addr);
  event SanctionRemoved(address indexed addr);
  event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

  modifier onlyOwner() {
    require(msg.sender == owner, "Not owner");
    _;
  }

  constructor() {
    owner = msg.sender;
  }

  function isSanctioned(address addr) external view override returns (bool) {
    return sanctioned[addr];
  }

  function addSanction(address addr) external onlyOwner {
    sanctioned[addr] = true;
    emit SanctionAdded(addr);
  }

  function addSanctionBatch(address[] calldata addrs) external onlyOwner {
    for (uint256 i = 0; i < addrs.length; i++) {
      sanctioned[addrs[i]] = true;
      emit SanctionAdded(addrs[i]);
    }
  }

  function removeSanction(address addr) external onlyOwner {
    sanctioned[addr] = false;
    emit SanctionRemoved(addr);
  }

  function removeSanctionBatch(address[] calldata addrs) external onlyOwner {
    for (uint256 i = 0; i < addrs.length; i++) {
      sanctioned[addrs[i]] = false;
      emit SanctionRemoved(addrs[i]);
    }
  }

  function transferOwnership(address newOwner) external onlyOwner {
    require(newOwner != address(0), "New owner is zero address");
    emit OwnershipTransferred(owner, newOwner);
    owner = newOwner;
  }
}
