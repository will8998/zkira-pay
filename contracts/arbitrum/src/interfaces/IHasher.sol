// SPDX-License-Identifier: MIT
pragma solidity ^0.7.0;

interface IHasher {
    function MiMCSponge(uint256 in_xL, uint256 in_xR, uint256 in_k) external pure returns (uint256 xL, uint256 xR);
}
