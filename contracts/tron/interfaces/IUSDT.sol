// SPDX-License-Identifier: MIT
pragma solidity ^0.7.0;

/**
 * @title IUSDT
 * @dev Interface for Tether's TRC-20 USDT on Tron.
 * Includes standard TRC-20 functions plus Tether-specific isBlackListed.
 * Note: Tether's transfer/transferFrom return void (not bool).
 */
interface IUSDT {
  function transfer(address to, uint256 value) external;
  function transferFrom(address from, address to, uint256 value) external;
  function approve(address spender, uint256 value) external;
  function balanceOf(address who) external view returns (uint256);
  function allowance(address owner, address spender) external view returns (uint256);
  function isBlackListed(address _maker) external view returns (bool);
}
