// SPDX-License-Identifier: MIT
pragma solidity ^0.7.0;

/**
 * @title IERC20
 * @dev Standard ERC-20 interface with bool returns + USDC blacklist check.
 * NOTE: USDC uses lowercase `isBlacklisted` (not `isBlackListed` like USDT).
 * NOTE: USDC transfer/transferFrom DO return bool (standard ERC-20).
 */
interface IERC20 {
    function transfer(address to, uint256 value) external returns (bool);
    function transferFrom(address from, address to, uint256 value) external returns (bool);
    function approve(address spender, uint256 value) external returns (bool);
    function balanceOf(address who) external view returns (uint256);
    function allowance(address owner, address spender) external view returns (uint256);
    // USDC-specific blacklist check (Circle's FiatTokenV2)
    function isBlacklisted(address _account) external view returns (bool);
}
