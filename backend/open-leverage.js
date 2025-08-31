import express from "express";
import axios from "axios";
import dotenv from "dotenv";
import Web3 from "web3";
import routerABI from "./abis/aave_v3_router.js";
import erc20ABI from "./abis/erc20.js";
import flashloanReceiverABI from "./abis/flashloan_receiver.js";

dotenv.config({ debug: true });
const app = express();

app.use(express.json());

// Initialize web3 provider
const web3 = new Web3(new Web3.providers.HttpProvider(process.env.NODE_API));

// Setup contract interfaces
const routerIface = new web3.eth.Contract(routerABI);
const erc20Iface = new web3.eth.Contract(erc20ABI);

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
      userAddress: process.env.FLASHLOAN_RECEIVER_ADDRESS, // Receiver is our contract
      outputReceiver: process.env.FLASHLOAN_RECEIVER_ADDRESS, // Output goes to our contract
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

  console.log("=== OPERATION DEBUGGING ===");
  console.log("Router address:", routerAddress);
  console.log("Swap calldata length:", swapCalldata.length);
  console.log("Swap calldata (first 100 chars):", swapCalldata.substring(0, 100));
  console.log("Base collateral amount:", colAmountBN.toString());
  console.log("Expected swap output:", effectiveOut.toString());
  console.log("=== END OPERATION DEBUGGING ===");

  // 3. Encode parameters for the new contract approach
  // The contract will execute: swap -> supply -> borrow -> repay
  const params = web3.eth.abi.encodeParameters(
    ['address', 'uint256', 'bytes'],
    [collateral, colAmountBN, swapCalldata]
  );

  console.log("=== PARAMETERS DEBUGGING ===");
  console.log("Encoded parameters:", params);
  console.log("Parameters length:", params.length);
  console.log("=== END PARAMETERS DEBUGGING ===");

  const receiverIface = new web3.eth.Contract(
    flashloanReceiverABI,
    process.env.FLASHLOAN_RECEIVER_ADDRESS
  );

  const startFlashLoanCalldata = receiverIface.methods
    .startFlashLoan(
      coin,         // asset to flash loan (DAI)
      coinAmountBN, // amount to flash loan
      params        // encoded parameters (collateral, baseAmount, swapCalldata)
    )
    .encodeABI();

  console.log("Flash loan calldata:", startFlashLoanCalldata);
  console.log("Complete transaction data:", {
    from: userAddress,
    to: process.env.FLASHLOAN_RECEIVER_ADDRESS,
    input: startFlashLoanCalldata,
    gas: "8000000"
  });

  // 4. Call Tenderly simulate
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
    parameters: {
      collateral: collateral,
      baseAmount: colAmountBN.toString(),
      swapCalldata: swapCalldata.substring(0, 100) + "..."
    }
  });
});

async function getTokenDecimals(token) {
  const contract = new web3.eth.Contract(erc20ABI, token);
  const decimals = await contract.methods.decimals().call();
  return Number(decimals);
}

app.listen(3000, () => console.log("API running on 3000"));
