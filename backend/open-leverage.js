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
 try {
    // === 1. SETUP CONNECTION TO YOUR TENDERLY FORK ===
    const web3 = new Web3(process.env.DEVNET_URL);
    
    // Add the user's private key to a local wallet. This allows web3 to sign transactions.
    const userAccount = web3.eth.accounts.privateKeyToAccount(process.env.PRIVATE_KEY);
    web3.eth.accounts.wallet.add(userAccount);
    
    const userAddress = userAccount.address;
    console.log("Operating on behalf of user:", userAddress);

    // === 3. GET SWAP CALLDATA (This part remains the same) ===
    const { collateral, coin, colAmount, coinAmount } = req.body;
    const coinDecimals = await getTokenDecimals(coin);
    const collateralDecimals = await getTokenDecimals(collateral);
    const coinAmountBN = BigInt(coinAmount * 10 ** coinDecimals);
    const colAmountBN = BigInt(colAmount * 10 ** collateralDecimals);

    console.log(`Checking allowance for ${colAmount} of ${collateral}...`);
    const tokenContract = new web3.eth.Contract(erc20ABI, collateral);
    const spenderAddress = process.env.FLASHLOAN_RECEIVER_ADDRESS;
    
    const currentAllowance = await tokenContract.methods.allowance(userAddress, spenderAddress).call();
    console.log(`Current allowance is: ${currentAllowance}`);

    // Compare BigInts to avoid precision issues
    if (BigInt(currentAllowance) < colAmountBN) {
      console.log("Allowance is too low. Sending approve transaction...");
      const maxUint256 = '115792089237316195423570985008687907853269984665640564039457584007913129639935';
      const approveMethod = tokenContract.methods.approve(spenderAddress, maxUint256);
      
      const gas = await approveMethod.estimateGas({ from: userAddress });
      const approveReceipt = await approveMethod.send({ from: userAddress, gas });

      console.log(`Approval successful! Tx Hash: ${approveReceipt.transactionHash}`);
    } else {
      console.log("Allowance is sufficient. No approval needed.");
    }
    

    const routerResp = await axios.post(
    process.env.ROUTER_URL,
    {
      inputToken: coin,
      outputToken: collateral,
      inputAmount: coinAmountBN.toString(),
      userAddress: "0x2EEF625EBf5f20eDf0D858E30d73b4321E6E5Eaa", 
      outputReceiver: "0x2EEF625EBf5f20eDf0D858E30d73b4321E6E5Eaa", 
      chainID: "ethereum",
      uniquePID: process.env.ROUTER_INTEGRATOR_PID,
      isPermit2: false,
      computeEstimate: true
    },
    {
      headers: { "x-api-key": process.env.ROUTER_API_KEY },
    }
  );

  if (routerResp.data.statusCode === 400) {
    return res.json({ message: routerResp.data.error });
  }

    const result = routerResp.data.result; 

    const routerAddress = result.router;
    const swapCalldata = result.calldata;


    // === 4. PREPARE AND SEND THE REAL TRANSACTION ===
    const flashloanContract = new web3.eth.Contract(
        flashloanReceiverABI,
        "0x2EEF625EBf5f20eDf0D858E30d73b4321E6E5Eaa"
    );
    
    // Build the transaction object
    const openPositionMethod = flashloanContract.methods.openLeveragedPosition(
        collateral,
        colAmountBN,
        coin,
        coinAmountBN,
        routerAddress,
        swapCalldata
    );

    // Estimate gas for the transaction
    // const estimatedGas = await openPositionMethod.estimateGas({ from: userAddress });
    // console.log(`Estimated gas: ${estimatedGas}`);

    console.log("Sending transaction to open leveraged position");
    const receipt = await openPositionMethod.send({
        from: userAddress
    });

    console.log("Transaction mined successfully!");

    // const tenderlyTxUrl = `https://dashboard.tenderly.co/account/{your-username}/project/{your-project}/fork/{your-fork-id}/transaction/${receipt.transactionHash}`;
    
    res.json({
        message: "Transaction successful!",
        transactionHash: receipt.transactionHash
    });

} catch (error) {
    console.error("--- TRANSACTION FAILED ---");
    // Web3.js often wraps the revert reason in a nested object
    const reason = error.innerError ? error.innerError.message : error.message;
    console.error("Error Reason:", reason);
    res.status(500).json({
        message: "An error occurred while sending the transaction.",
        error: reason,
    });
}
});

async function getTokenDecimals(token) {
  const contract = new web3.eth.Contract(erc20ABI, token);
  const decimals = await contract.methods.decimals().call();
  return Number(decimals);
}

app.listen(3000, () => console.log("API running on 3000"));
