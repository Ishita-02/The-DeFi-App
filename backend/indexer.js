// indexer.js
import Web3 from "web3";
import WebSocket from "ws";


// Use WSS endpoint instead of HTTPS
const WSS_URL = "wss://hyperliquid-mainnet.g.alchemy.com/v2/AqK-lMhLej1xV4uOTUDOKt724_JJsrwb";


const ws = new WebSocket(WSS_URL);

ws.on("open", () => {
  console.log("Connected to Ethereum node via WebSocket");

  // Subscribe to new block headers
  ws.send(JSON.stringify({
    id: 1,
    method: "eth_subscribe",
    params: ["newHeads"]
  }));
});

ws.on("message", (message) => {
  const data = JSON.parse(message);
  if (data.method === "eth_subscription") {
    console.log("New block header:", data.params.result);
  } else {
    console.log("Message:", data);
  }
});

