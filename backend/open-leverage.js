import express from "express";
import axios from "axios";
import dotenv from "dotenv";
import Web3 from "web3";
import routerABI from "./abis/aave_v3_router.js";
import multicallABI from "./abis/multicall_contract.js";
import erc20ABI from "./abis/erc20.js";
import flashloanReceiverABI from "./abis/flashloan_receiver.js";

dotenv.config({ debug: true });
const app = express();

app.use(express.json());

// Initialize web3 provider
const web3 = new Web3(new Web3.providers.HttpProvider(process.env.NODE_API));

// Setup contract interfaces
const routerIface = new web3.eth.Contract(routerABI);
const multicallIface = new web3.eth.Contract(multicallABI);

app.post("/open-position", async (req, res) => {
  const { collateral, coin, colAmount, coinAmount, userAddress } = req.body;
  console.log("body", req.body);

  const coinDecimals = await getTokenDecimals(coin);
  const collateralDecimals = await getTokenDecimals(collateral);
  const coinAmountBN = BigInt((BigInt(coinAmount) * BigInt(10 ** coinDecimals)).toString());
  const colAmountBN = BigInt((BigInt(colAmount) * BigInt(10 ** collateralDecimals)).toString());

  // 1. Call router API to get swap output
  const routerResp = await axios.post(
    process.env.ROUTER_URL,
    {
      inputToken: coin,
      outputToken: collateral,
      inputAmount: coinAmountBN.toString(),
      userAddress: userAddress,
      outputReceiver: userAddress,
      chainID: "ethereum",
      uniquePID: process.env.ROUTER_INTEGRATOR_PID,
      isPermit2: false,
    },
    {
      headers: { "x-api-key": process.env.ROUTER_API_KEY },
    }
  );

  if (routerResp.data.statusCode == 400) {
    res.json({
      message: routerResp.data.error,
    });
    return;
  }

  console.log("router response", routerResp.data.result);
  let result = routerResp.data.result

  const effectiveOut = result.effectiveOutputAmount; // collateral gained from swap

  // 2. Encode swap calldata from router response
  const swapCalldata = result.calldata;
  const routerAddress = result.router;

  // 3. Encode Aave supply & borrow
  const totalCollateral = BigInt(colAmountBN) + BigInt(effectiveOut);
  const supplyCalldata = routerIface.methods
    .supply(collateral, totalCollateral, userAddress, 0)
    .encodeABI();

  const premium = (coinAmountBN * BigInt(5)) / BigInt(10000); 
  const repayAmount = coinAmountBN + premium;
  const borrowCalldata = routerIface.methods
    .borrow(coin, repayAmount.toString(), 2, 0, userAddress)
    .encodeABI();

  //   if (getHealthFactor(address(this)) >= minHealthFactor) { ... }

  // 4. Bundle in multicall
  const multicallData = multicallIface.methods
    .aggregate([
      [routerAddress, swapCalldata],
      [process.env.AAVE_V3_ROUTER_ADDRESS, supplyCalldata],
      [process.env.AAVE_V3_ROUTER_ADDRESS, borrowCalldata],
    ])
    .encodeABI();

  const receiverIface = new web3.eth.Contract(
    flashloanReceiverABI,
    process.env.FLASHLOAN_RECEIVER_ADDRESS
  );

  const startFlashLoanCalldata = receiverIface.methods
    .startFlashLoan(
      coin,         
      coinAmountBN,   
      multicallData   
    )
    .encodeABI();

    console.log("calldata", multicallData);

  // 5. Call Tenderly simulate
  const tenderlyResp = await axios.post(
    `${process.env.TENDERLY_API_URL}/simulate`,
    {
      network_id: "1",
      from: userAddress,
      to: process.env.FLASHLOAN_RECEIVER_ADDRESS,
      input: startFlashLoanCalldata,
      gas: "8000000"
    },
    {
      headers: { "X-Access-Key": process.env.TENDERLY_ACCESS_KEY },
    }
  );

  res.json({
    simulationUrl: tenderlyResp.data.simulation.public_url,
    swapOut: effectiveOut.toString(),
  });
});

async function getTokenDecimals(token) {
  const contract = new web3.eth.Contract(erc20ABI, token);
  const decimals = await contract.methods.decimals().call();
  return Number(decimals);
}

app.listen(3000, () => console.log("API running on 3000"));
