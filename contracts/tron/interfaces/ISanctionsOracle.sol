// SPDX-License-Identifier: MIT
pragma solidity ^0.7.0;

interface ISanctionsOracle {
    function isSanctioned(address addr) external view returns (bool);
}
