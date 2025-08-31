// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {IPool} from "@aave/core-v3/contracts/interfaces/IPool.sol";
import {IFlashLoanSimpleReceiver} from "@aave/core-v3/contracts/flashloan/interfaces/IFlashLoanSimpleReceiver.sol";
import {IPoolAddressesProvider} from "@aave/core-v3/contracts/interfaces/IPoolAddressesProvider.sol";


contract FlashLoanReceiver is IFlashLoanSimpleReceiver {
    using SafeERC20 for IERC20;

    IPool public immutable lendingPool;
    IPoolAddressesProvider public immutable provider;
    address public immutable owner;
    address public immutable multicallContract;

    constructor(address _provider, address _multicallContract) {
        provider = IPoolAddressesProvider(_provider);
        lendingPool = IPool(provider.getPool());
        multicallContract = _multicallContract;
        owner = msg.sender;
    }

    function ADDRESSES_PROVIDER() external view override returns (IPoolAddressesProvider) {
        return provider;
    }

    function POOL() external view override returns (IPool) {
        return lendingPool;
    }

    /// @notice Initiates a flashloan
    function startFlashLoan(
        address asset,
        uint256 amount,
        bytes calldata routerCalldata
    ) external {
        require(msg.sender == owner, "Not owner");

        bytes memory params = abi.encode(routerCalldata);

        lendingPool.flashLoanSimple(
            address(this), 
            asset,
            amount,
            params,
            0
        );
    }

    /// @notice Aave calls this after transferring the flashloaned funds
    function executeOperation(
        address asset,
        uint256 amount,
        uint256 premium,
        address initiator,
        bytes calldata params
    ) external override returns (bool) {
        require(msg.sender == address(lendingPool), "Caller not pool");
        require(initiator == address(this), "Bad initiator");

        // Decode parameters - routerCalldata is the first and only parameter
        bytes memory routerCalldata = abi.decode(params, (bytes));
        
        // Decode the router calldata to get the actual parameters
        (address router, address collateral, uint256 baseAmount, bytes memory swapCalldata) = abi.decode(routerCalldata, (address, address, uint256, bytes));
        
        // 1. Execute swap (router gets DAI from flash loan)
        IERC20(asset).approve(router, amount);
        (bool swapSuccess, ) = router.call(swapCalldata);
        require(swapSuccess, "Swap failed");
        
        // 2. Supply base amount + swapped amount to Aave
        uint256 swappedAmount = IERC20(collateral).balanceOf(address(this));
        uint256 totalSupply = baseAmount + swappedAmount;
        IERC20(collateral).approve(address(lendingPool), totalSupply);
        lendingPool.supply(collateral, totalSupply, address(this), 0);
        
        // 3. Borrow DAI to repay flash loan and repay it
        uint256 totalDebt = amount + premium;
        lendingPool.borrow(asset, totalDebt, 2, 0, address(this));
        IERC20(asset).approve(address(lendingPool), totalDebt);
        
        return true;
    }   

}
