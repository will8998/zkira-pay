// SPDX-License-Identifier: MIT
pragma solidity ^0.7.0;

import "./ComplianceTornado.sol";
import "./interfaces/IERC20.sol";

/**
 * @title ERC20Pool
 * @dev Generic ERC-20 privacy pool with triple-layer compliance + protocol fee + referral system.
 * Works for any ERC-20 token (USDC, DAI, etc.) with optional blacklist support.
 *
 * Compliance layers:
 * 1. Sanctions oracle check (external, e.g. Chainalysis OFAC list)
 * 2. Local blocklist (owner-managed)
 * 3. Token's own blacklist (optional, e.g. USDC's isBlacklisted)
 *
 * Fee deduction on withdrawal:
 * - Protocol fee → treasury
 * - Referral fee → referrer address (if provided and registered)
 * - Relayer fee → relayer address (standard Tornado Cash mechanism)
 *
 * Constructor flag `hasBlacklistCheck` enables/disables token blacklist checking:
 *   USDC = true (Circle's FiatTokenV2 has isBlacklisted)
 *   DAI = false (no blacklist function)
 *
 * Denomination is in token's native decimal format:
 *   10 USDC   = 10_000_000 (6 decimals)
 *   100 USDC  = 100_000_000
 *   1000 USDC = 1_000_000_000
 */
contract ERC20Pool is ComplianceTornado {
  IERC20 public token;
  bool public hasBlacklistCheck; // Some tokens (USDC) have blacklist, others (DAI) don't

  constructor(
    IVerifier _verifier,
    IHasher _hasher,
    uint256 _denomination,
    uint32 _merkleTreeHeight,
    IERC20 _token,
    ISanctionsOracle _sanctionsOracle,
    uint256 _protocolFeeBps,
    address _treasury,
    bool _hasBlacklistCheck
  ) ComplianceTornado(_verifier, _hasher, _denomination, _merkleTreeHeight, _sanctionsOracle, _protocolFeeBps, _treasury) {
    token = _token;
    hasBlacklistCheck = _hasBlacklistCheck;
  }

  function _processDeposit() internal override {
    require(msg.value == 0, "ETH value is supposed to be 0 for ERC20 instance");

    // COMPLIANCE CHECK 3: Token's own blacklist (if applicable, e.g., USDC)
    if (hasBlacklistCheck) {
      require(!token.isBlacklisted(msg.sender), "Depositor is token-blacklisted");
      require(!token.isBlacklisted(address(this)), "Pool is token-blacklisted");
    }

    // Standard ERC-20 transferFrom (returns bool)
    require(token.transferFrom(msg.sender, address(this), denomination), "Transfer failed");
  }

  function _processWithdraw(
    address payable _recipient,
    address payable _relayer,
    uint256 _fee,
    uint256 _refund,
    address _referrer,
    bytes32 _nullifierHash
  ) internal override {
    require(msg.value == _refund, "Incorrect refund amount");

    // Calculate fees
    uint256 protocolFee = (denomination * protocolFeeBps) / 10000;
    uint256 referralFee = 0;
    if (_referrer != address(0) && registeredReferrers[_referrer]) {
      referralFee = (denomination * referralFeeBps[_referrer]) / 10000;
    }

    uint256 totalDeductions = _fee + protocolFee + referralFee;
    require(totalDeductions <= denomination, "Total fees exceed denomination");

    uint256 recipientAmount = denomination - totalDeductions;

    // Transfer to recipient
    require(token.transfer(_recipient, recipientAmount), "Recipient transfer failed");

    // Transfer relayer fee
    if (_fee > 0) {
      require(token.transfer(_relayer, _fee), "Relayer transfer failed");
    }

    // Transfer protocol fee to treasury
    if (protocolFee > 0) {
      require(token.transfer(treasury, protocolFee), "Treasury transfer failed");
      totalProtocolFees += protocolFee;
      emit ProtocolFeePayment(treasury, protocolFee);
    }

    // Transfer referral fee
    if (referralFee > 0) {
      require(token.transfer(_referrer, referralFee), "Referral transfer failed");
      referralEarnings[_referrer] += referralFee;
      emit ReferralPayment(_referrer, referralFee, _nullifierHash);
    }

    // Handle ETH refund (usually 0 for ERC-20 pools)
    if (_refund > 0) {
      (bool success, ) = _recipient.call{ value: _refund }("");
      if (!success) {
        _relayer.transfer(_refund);
      }
    }
  }

  /**
   * @dev Emergency: if pool gets token-blacklisted, allow owner to attempt recovery.
   * This can ONLY be called if the pool IS blacklisted — cannot steal funds otherwise.
   * In practice, if the pool is blacklisted, transfers will also fail, but this
   * provides a mechanism for the owner to attempt recovery.
   */
  function emergencyWithdrawToOwner() external onlyOwner {
    require(hasBlacklistCheck, "No blacklist check for this token");
    require(token.isBlacklisted(address(this)), "Pool is not blacklisted");
    uint256 balance = token.balanceOf(address(this));
    if (balance > 0) {
      token.transfer(owner, balance);
    }
  }
}
