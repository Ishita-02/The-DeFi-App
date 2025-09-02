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

    struct FlashLoanCache {
        address collateral;
        uint256 baseAmount;
        address router;
        bytes swapCalldata;
    }
    FlashLoanCache private cache;

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
    
    function openLeveragedPosition(
        address _collateral,
        uint256 _baseAmount,
        address _flashLoanAsset,
        uint256 _flashLoanAmount,
        address _router,
        bytes calldata _swapCalldata
    ) external {
       
        IERC20(_collateral).safeTransferFrom(msg.sender, address(this), _baseAmount);

        _startFlashLoan(
            _collateral,
            _baseAmount,
            _flashLoanAsset,
            _flashLoanAmount,
            _router,
            _swapCalldata
        );
    }

    function executeOperation(
        address asset,
        uint256 amount,
        uint256 premium,
        address initiator,
        bytes calldata params
    ) external override returns (bool) {
        require(msg.sender == address(lendingPool), "Caller not pool");
        require(initiator == address(this), "Bad initiator");

        FlashLoanCache memory currentCache = cache;
        
        IERC20(asset).approve(currentCache.router, 0);
        IERC20(asset).approve(currentCache.router, amount);
        
        (bool swapSuccess, ) = currentCache.router.call(currentCache.swapCalldata);
        require(swapSuccess, "Swap failed");
        
        uint256 swappedAmount = IERC20(currentCache.collateral).balanceOf(address(this)) - currentCache.baseAmount;
        uint256 totalSupply = currentCache.baseAmount + swappedAmount;

        IERC20(currentCache.collateral).approve(address(lendingPool), 0);
        IERC20(currentCache.collateral).approve(address(lendingPool), totalSupply);
        lendingPool.supply(currentCache.collateral, totalSupply, address(this), 0);
        
        uint256 totalDebt = amount + premium;
        lendingPool.borrow(asset, totalDebt, 2, 0, address(this));
        
        delete cache;

        return true;
    }

    function _startFlashLoan(
        address _collateral,
        uint256 _baseAmount,
        address _flashLoanAsset,
        uint256 _flashLoanAmount,
        address _router,
        bytes calldata _swapCalldata
    ) internal {
        cache = FlashLoanCache({
            collateral: _collateral,
            baseAmount: _baseAmount,
            router: _router,
            swapCalldata: _swapCalldata
        });

        lendingPool.flashLoanSimple(
            address(this),
            _flashLoanAsset,
            _flashLoanAmount,
            "", 
            0
        );
    }
}

