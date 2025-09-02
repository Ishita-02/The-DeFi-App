require("@nomicfoundation/hardhat-toolbox");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  defaultNetwork: "hardhat",
  type: "module",
  solidity: {
    version: "0.8.28",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      },
      viaIR: true
    }
  },
  networks: {
    hardhat: {
      forking: {
        url: "https://eth-mainnet.g.alchemy.com/v2/mKqsr2gMF8yq9CuSAEhG15FOd48HHyyC",
        blockNumber: 23268082, 
      },
      gas: "auto", 
      gasPrice: "auto", 
      initialBaseFeePerGas: 0, 
    },
    sepolia: {
      url: "https://eth-sepolia.g.alchemy.com/v2/mKqsr2gMF8yq9CuSAEhG15FOd48HHyyC",
      accounts: ["7e3e2711f139f55b3dcd79e62d0dc9dda1f4cc5e6764266397333efa517d735e"]
    },
    virtualMainnet: {
      url: "https://virtual.mainnet.eu.rpc.tenderly.co/acd37680-2d74-479b-9323-d49d95e671de",
      chainId: 1 
    }
  }
};
