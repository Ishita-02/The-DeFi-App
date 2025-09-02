# FlashLoanReceiver Testing Suite

This project contains a comprehensive testing suite for the FlashLoanReceiver smart contract that implements a complete leverage position flow using flash loans.

## Project Structure

```
backend/
├── contracts/contracts/
│   ├── FlashLoanReceiver.sol          # Main contract
│   └── mocks/                         # Mock contracts for testing
│       ├── MockERC20.sol              # Mock ERC20 tokens
│       ├── MockRouter.sol             # Mock DEX router
│       ├── MockAavePool.sol           # Mock Aave pool
│       └── MockAaveProvider.sol       # Mock Aave provider
├── test/
│   └── FlashLoanReceiver.test.js      # Comprehensive test suite
├── scripts/
│   └── deploy.js                      # Deployment script
├── hardhat.config.js                  # Hardhat configuration
└── package.json                       # Dependencies
```

## Setup Instructions

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Variables
Create a `.env` file with:
```bash
NODE_API=https://eth-mainnet.alchemyapi.io/v2/YOUR_KEY
ROUTER_URL=your_router_api_url
ROUTER_INTEGRATOR_PID=your_pid
ROUTER_API_KEY=your_api_key
AAVE_V3_ROUTER_ADDRESS=0x87870Bca3F3fD6335C3F4ce8392D69350b4fa4e2
FLASHLOAN_RECEIVER_ADDRESS=0x... # Your deployed contract
TENDERLY_API_URL=https://api.tenderly.co/api/v1
TENDERLY_ACCESS_KEY=your_tenderly_key
```

### 3. Compile Contracts
```bash
npm run compile
```

## Testing

### Run All Tests
```bash
npm test
```

### Run Specific Test File
```bash
npx hardhat test test/FlashLoanReceiver.test.js
```

### Run Tests with Verbose Output
```bash
npx hardhat test --verbose
```

## Test Coverage

The test suite covers:

### 1. **Deployment Tests**
- ✅ Contract deployment with correct parameters
- ✅ Owner, provider, and pool address verification

### 2. **Access Control Tests**
- ✅ Only owner can call startFlashLoan
- ✅ Proper access restrictions

### 3. **Flash Loan Flow Tests**
- ✅ Complete leverage flow execution
- ✅ Flash loan premium handling
- ✅ Error handling for failed operations

### 4. **Operation Tests**
- ✅ Swap execution via router
- ✅ Aave supply operations
- ✅ Aave borrow operations
- ✅ Flash loan repayment

### 5. **Token Approval Tests**
- ✅ DAI approval to router
- ✅ USDC approval to Aave
- ✅ Proper allowance management

### 6. **Error Handling Tests**
- ✅ Invalid caller rejection
- ✅ Wrong initiator rejection
- ✅ Operation failure handling

## Mock Contracts

### MockERC20
- Simulates ERC20 tokens with configurable decimals
- Includes mint/burn functions for testing

### MockRouter
- Simulates DEX router operations
- Handles token swaps with simple 1:1 rates
- Emits swap events for verification

### MockAavePool
- Simulates Aave V3 pool operations
- Handles supply, borrow, and flash loans
- Configurable failure modes for testing

### MockAaveProvider
- Returns the mock pool address
- Simulates Aave's address provider pattern

## Deployment

### Deploy to Local Network
```bash
npx hardhat node
npm run deploy
```

### Deploy to Testnet
```bash
npx hardhat run scripts/deploy.js --network goerli
```

## Testing Scenarios

### 1. **Happy Path**
- Flash loan → Swap → Supply → Borrow → Repay
- All operations succeed
- Proper token balances and approvals

### 2. **Error Scenarios**
- Invalid swap calldata
- Aave supply failures
- Aave borrow failures
- Access control violations

### 3. **Edge Cases**
- Zero amounts
- Invalid token addresses
- Flash loan premium variations

## Debugging

### Enable Hardhat Console Logging
```javascript
// In your test
console.log("Token balance:", await mockDAI.balanceOf(user.address));
console.log("Allowance:", await mockDAI.allowance(user.address, router.address));
```

### View Contract State
```javascript
// Check contract state
const owner = await flashLoanReceiver.owner();
const provider = await flashLoanReceiver.provider();
const pool = await flashLoanReceiver.lendingPool();
```

## Integration with Main Contract

After testing with mocks, you can:

1. **Deploy to Hardhat mainnet fork** for real protocol testing
2. **Test with actual Aave V3 contracts** on fork
3. **Verify on Tenderly** with real contract addresses
4. **Deploy to testnet** for final validation

## Troubleshooting

### Common Issues

1. **Compilation Errors**
   - Check Solidity version compatibility
   - Verify import paths
   - Ensure all dependencies are installed

2. **Test Failures**
   - Check mock contract deployments
   - Verify token balances and approvals
   - Review error messages for specific failures

3. **Deployment Issues**
   - Verify network configuration
   - Check environment variables
   - Ensure sufficient gas for deployment

## Next Steps

1. **Run the test suite** to verify contract functionality
2. **Deploy to Hardhat fork** for real protocol testing
3. **Test with actual DeFi protocols** on fork
4. **Deploy to testnet** for final validation
5. **Integrate with your API** for production use

## Support

For issues or questions:
- Check the test output for specific error messages
- Review the mock contract implementations
- Verify your environment configuration
- Check Hardhat documentation for debugging tips

