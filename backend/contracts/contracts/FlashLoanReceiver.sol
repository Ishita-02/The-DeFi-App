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

    constructor(address _provider) {
        provider = IPoolAddressesProvider(_provider);
        lendingPool = IPool(provider.getPool());
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

        bytes memory routerCalldata = abi.decode(params, (bytes));

        (bool ok, bytes memory result) = address(this).call(routerCalldata);
        require(ok, string(result));

        uint256 totalDebt = amount + premium;
        IERC20(asset).approve(address(lendingPool), totalDebt);

        return true;
    }
}
