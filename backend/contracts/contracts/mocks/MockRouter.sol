// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./MockERC20.sol";

contract MockRouter {
    event SwapExecuted(
        address indexed inputToken,
        address indexed outputToken,
        uint256 inputAmount,
        uint256 outputAmount,
        address indexed recipient
    );

    function swap(
        address inputToken,
        address outputToken,
        uint256 inputAmount,
        address recipient
    ) external returns (uint256 outputAmount) {
        require(inputToken != outputToken, "Same token");
        require(inputAmount > 0, "Zero input amount");
        
        // Simple 1:1 swap for testing
        outputAmount = inputAmount;
        
        // Transfer input tokens from caller
        IERC20(inputToken).transferFrom(msg.sender, address(this), inputAmount);
        
        // Mint output tokens to recipient (simulating swap)
        MockERC20(outputToken).mint(recipient, outputAmount);
        
        emit SwapExecuted(inputToken, outputToken, inputAmount, outputAmount, recipient);
        
        return outputAmount;
    }
}
