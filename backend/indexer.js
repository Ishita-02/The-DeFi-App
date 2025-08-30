import Web3 from "web3";
import WebSocket from "ws";

class TransferIndexer {
  constructor() {
    // HyperEVM WebSocket URL
    this.WSS_URL = "wss://hyperliquid-mainnet.g.alchemy.com/v2/AqK-lMhLej1xV4uOTUDOKt724_JJsrwb";
    
    // Transfer event signature
    this.TRANSFER_SIGNATURE = "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";
    
    this.ws = null;
    this.web3 = new Web3();
    this.isConnected = false;
    this.transferCount = 0;
    
    this.init();
  }

  async init() {
    console.log("🚀 Starting HyperEVM Transfer Indexer...");
    
    try {
      await this.connect();
      await this.subscribeToTransfers();
      this.startStatsLogger();
      
      console.log("✅ Transfer Indexer is running!");
      console.log("Listening for Transfer events...\n");
    } catch (error) {
      console.error("❌ Failed to start indexer:", error);
      process.exit(1);
    }
  }

  async connect() {
    return new Promise((resolve, reject) => {
      console.log("🔗 Connecting to HyperEVM node...");
      
      this.ws = new WebSocket(this.WSS_URL);

      this.ws.on("open", () => {
        console.log("✅ Connected to HyperEVM WebSocket");
        this.isConnected = true;
        resolve();
      });

      this.ws.on("error", (error) => {
        console.error("❌ WebSocket error:", error);
        this.isConnected = false;
        reject(error);
      });

      this.ws.on("close", () => {
        console.log("🔌 WebSocket connection closed");
        this.isConnected = false;
        this.reconnect();
      });

      this.ws.on("message", (message) => {
        this.handleMessage(message);
      });

      // Connection timeout
      setTimeout(() => {
        if (!this.isConnected) {
          reject(new Error("Connection timeout"));
        }
      }, 10000);
    });
  }

  async subscribeToTransfers() {
    const subscribeRequest = {
      id: 1,
      method: "eth_subscribe",
      params: [
        "logs",
        {
          topics: [this.TRANSFER_SIGNATURE] // Only Transfer events
        }
      ]
    };

    console.log("📡 Subscribing to Transfer events...");
    this.ws.send(JSON.stringify(subscribeRequest));
  }

  handleMessage(message) {
    try {
      const data = JSON.parse(message);
      
      // Handle subscription confirmation
      if (data.result && data.id === 1) {
        console.log(`✅ Transfer subscription confirmed: ${data.result}`);
        return;
      }
      
      // Handle incoming Transfer events
      if (data.method === "eth_subscription" && data.params) {
        const { result } = data.params;
        
        // Make sure it's a Transfer event
        if (result.topics && result.topics[0] === this.TRANSFER_SIGNATURE) {
          this.processTransferEvent(result);
        }
      }
    } catch (error) {
      console.error("❌ Error parsing message:", error);
    }
  }

  processTransferEvent(log) {
    try {
      this.transferCount++;
      
      // Decode Transfer event: Transfer(address indexed from, address indexed to, uint256 value)
      const from = "0x" + log.topics[1].slice(26);  // Remove padding
      const to = "0x" + log.topics[2].slice(26);    // Remove padding
      if (log.data != "0x") {
        var value = this.web3.utils.hexToNumberString(log.data);
      }
      const blockNumber = parseInt(log.blockNumber, 16);
      const transactionHash = log.transactionHash;
      const contractAddress = log.address;

      // Log the transfer details
      let hypeValue = this.web3.utils.fromWei(value, 'ether')
      if (parseInt(hypeValue) > 100) {
        console.log(`
🔄 TRANSFER #${this.transferCount}
├── Block: ${blockNumber}
├── Contract: ${contractAddress}
├── From: ${from}
├── To: ${to}
├── Value: ${value} (hype)
├── Value (HYPE): ${hypeValue} HYPE
└── Tx Hash: ${transactionHash}
      `.trim());
      
      // Add separator for readability
      console.log("─".repeat(80));

      } 
      
    } catch (error) {
      console.error("❌ Error processing transfer:", error);
      console.error("Raw log:", log);
    }
  }

  startStatsLogger() {
    // Log stats every 30 seconds
    setInterval(() => {
      const uptime = Math.floor(process.uptime());
      console.log(`
📊 STATS UPDATE
├── Connected: ${this.isConnected ? '✅' : '❌'}
├── Transfers Processed: ${this.transferCount}
├── Uptime: ${uptime} seconds
└── Time: ${new Date().toLocaleString()}
      `.trim());
      console.log("─".repeat(50));
    }, 30000);
  }

  async reconnect() {
    console.log("🔄 Attempting to reconnect in 5 seconds...");
    
    setTimeout(async () => {
      try {
        await this.connect();
        await this.subscribeToTransfers();
        console.log("✅ Reconnected successfully!");
      } catch (error) {
        console.error("❌ Reconnection failed:", error);
        this.reconnect();
      }
    }, 5000);
  }

  shutdown() {
    console.log("\n🛑 Shutting down Transfer Indexer...");
    console.log(`📊 Final Stats: ${this.transferCount} transfers processed`);
    
    if (this.ws) {
      this.ws.close();
    }
    
    console.log("✅ Shutdown complete");
    process.exit(0);
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n⚠️  Received SIGINT signal...');
  if (global.indexer) {
    global.indexer.shutdown();
  }
});

process.on('SIGTERM', () => {
  console.log('\n⚠️  Received SIGTERM signal...');
  if (global.indexer) {
    global.indexer.shutdown();
  }
});

// Start the indexer
const indexer = new TransferIndexer();
global.indexer = indexer;

console.log(`
🎯 HyperEVM Transfer Event Indexer
================================
Only tracking ERC-20 Transfer events
Press Ctrl+C to stop
`);