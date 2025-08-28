import Web3 from "web3";
import express from "express";
import { configDotenv } from "dotenv";

configDotenv();

const router = express.Router();

// Initialize Web3 with Tenderly gateway
const web3 = new Web3(process.env.NODE_API);

// Main simulation endpoint
router.post("/", async (req, res) => {
  try {
    const { txHash } = req.body;
    
    // Validate input
    if (!txHash) {
      return res.status(400).json({
        error: 'Transaction hash is required',
        example: {
          txHash: txHash
        }
      });
    }

    // Validate transaction hash format
    if (!/^0x[a-fA-F0-9]{64}$/.test(txHash)) {
      return res.status(400).json({
        error: 'Invalid transaction hash format'
      });
    }

    console.log(`Analyzing transaction: ${txHash}`);

    // Get transaction details
    const transaction = await web3.eth.getTransaction(txHash);
    if (!transaction) {
      return res.status(404).json({
        error: 'Transaction not found'
      });
    }

    // Get transaction receipt
    const receipt = await web3.eth.getTransactionReceipt(txHash);
    
    // Get transaction trace using Tenderly
    let trace = null;
    try {
      trace = await web3.currentProvider.request({
        jsonrpc: "2.0",
        method: "tenderly_traceTransaction",
        params: [txHash],
        id: 0,
      });
    } catch (traceError) {
      console.warn('Trace not available:', traceError.message);
    }

    // Prepare response
    const result = {
        trace
    }
    // const result = {
    //   txHash,
    //   transaction: {
    //     from: transaction.from,
    //     to: transaction.to,
    //     value: web3.utils.fromWei(transaction.value, 'ether') + ' ETH',
    //     gas: transaction.gas,
    //     gasPrice: web3.utils.fromWei(transaction.gasPrice, 'gwei') + ' Gwei',
    //     nonce: transaction.nonce,
    //     blockNumber: transaction.blockNumber,
    //     blockHash: transaction.blockHash,
    //     transactionIndex: transaction.transactionIndex
    //   },
    //   receipt: {
    //     status: receipt ? receipt.status : null,
    //     gasUsed: receipt ? receipt.gasUsed : null,
    //     effectiveGasPrice: receipt && receipt.effectiveGasPrice 
    //       ? web3.utils.fromWei(receipt.effectiveGasPrice, 'gwei') + ' Gwei' 
    //       : null,
    //     cumulativeGasUsed: receipt ? receipt.cumulativeGasUsed : null,
    //     logs: receipt ? receipt.logs.length : 0,
    //     logsBloom: receipt ? receipt.logsBloom : null
    //   },
    //   trace: trace || 'Trace not available',
    //   simulation: {
    //     success: receipt ? receipt.status === true : null,
    //     timestamp: new Date().toISOString(),
    //     gasEfficiency: receipt && transaction 
    //       ? `${((receipt.gasUsed / transaction.gas) * 100).toFixed(2)}%`
    //       : null
    //   }
    // };

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('Simulation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to simulate transaction',
      details: error.message
    });
  }
});

export default router;