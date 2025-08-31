// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IMulticall {
    function aggregate(
        address[] calldata targets,
        bytes[] calldata calldatas
    ) external returns (uint256 blockNumber, bytes[] memory returnData);
}
