require("@nomicfoundation/hardhat-toolbox");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  defaultNetwork: "sepolia",
  type: "module",
  networks: {
    hardhat: {
      forking: {
        url: "https://eth-mainnet.g.alchemy.com/v2/mKqsr2gMF8yq9CuSAEhG15FOd48HHyyC",
        blockNumber: 23252509, 
      },
    },
    sepolia: {
      url: "https://eth-sepolia.g.alchemy.com/v2/mKqsr2gMF8yq9CuSAEhG15FOd48HHyyC",
      accounts: [""]
    }
  },
  solidity: "0.8.28",
};
