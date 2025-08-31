// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract MockAaveProvider {
    address public immutable pool;

    constructor(address _pool) {
        pool = _pool;
    }

    function getPool() external view returns (address) {
        return pool;
    }
}
