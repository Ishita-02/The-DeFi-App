// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "../FlashLoanReceiver.sol";
import "./MockERC20.sol";

contract MockAavePool {
    using SafeERC20 for IERC20;

    address public provider;
    uint256 public flashLoanPremium = 0.05e18; // 0.05% premium
    bool public shouldRevertSupply = false;
    bool public shouldRevertBorrow = false;

    mapping(address => mapping(address => uint256)) public userBalances; // user => token => balance
    mapping(address => mapping(address => uint256)) public userBorrows; // user => token => borrow amount

    event Supply(address indexed asset, address indexed user, uint256 amount, uint16 referral);
    event Borrow(address indexed asset, address indexed user, uint256 amount, uint256 interestRateMode, uint16 referral);
    event FlashLoan(address indexed receiver, address indexed asset, uint256 amount, uint256 premium);

    constructor() {
        provider = msg.sender;
    }

    function setFlashLoanPremium(uint256 _premium) external {
        flashLoanPremium = _premium;
    }

    function setShouldRevertSupply(bool _shouldRevert) external {
        shouldRevertSupply = _shouldRevert;
    }

    function setShouldRevertBorrow(bool _shouldRevert) external {
        shouldRevertBorrow = _shouldRevert;
    }

    function supply(
        address asset,
        uint256 amount,
        address onBehalfOf,
        uint16 referral
    ) external {
        require(!shouldRevertSupply, "Supply failed");
        
        IERC20(asset).safeTransferFrom(msg.sender, address(this), amount);
        userBalances[onBehalfOf][asset] += amount;
        
        emit Supply(asset, onBehalfOf, amount, referral);
    }

    function borrow(
        address asset,
        uint256 amount,
        uint256 interestRateMode,
        uint16 referral,
        address onBehalfOf
    ) external {
        require(!shouldRevertBorrow, "Borrow failed");
        
        // Simple borrow logic - mint tokens to borrower
        MockERC20(asset).mint(onBehalfOf, amount);
        userBorrows[onBehalfOf][asset] += amount;
        
        emit Borrow(asset, onBehalfOf, amount, interestRateMode, referral);
    }

    function flashLoanSimple(
        address receiverAddress,
        address asset,
        uint256 amount,
        bytes calldata params,
        uint16 referralCode
    ) external {
        // Transfer flash loaned tokens to receiver
        MockERC20(asset).mint(receiverAddress, amount);
        
        // Calculate premium
        uint256 premium = (amount * flashLoanPremium) / 1e18;
        
        // Call executeOperation on receiver
        FlashLoanReceiver(receiverAddress).executeOperation(
            asset,
            amount,
            premium,
            receiverAddress,
            params
        );
        
        // Transfer back the borrowed amount + premium
        IERC20(asset).safeTransferFrom(receiverAddress, address(this), amount + premium);
        
        emit FlashLoan(receiverAddress, asset, amount, premium);
    }

    function getReserveData(address asset) external view returns (
        uint256 configuration,
        uint128 liquidityIndex,
        uint128 variableBorrowIndex,
        uint128 currentLiquidityRate,
        uint128 currentVariableBorrowRate,
        uint128 currentStableBorrowRate,
        uint40 lastUpdateTimestamp
    ) {
        // Return mock data
        return (0, 1e27, 1e27, 0, 0, 0, uint40(block.timestamp));
    }
}
