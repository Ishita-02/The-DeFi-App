const flashloanReceiverABI = [
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "_provider",
          "type": "address"
        }
      ],
      "stateMutability": "nonpayable",
      "type": "constructor"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "token",
          "type": "address"
        }
      ],
      "name": "SafeERC20FailedOperation",
      "type": "error"
    },
    {
      "inputs": [],
      "name": "ADDRESSES_PROVIDER",
      "outputs": [
        {
          "internalType": "contract IPoolAddressesProvider",
          "name": "",
          "type": "address"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "POOL",
      "outputs": [
        {
          "internalType": "contract IPool",
          "name": "",
          "type": "address"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "asset",
          "type": "address"
        },
        {
          "internalType": "uint256",
          "name": "amount",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "premium",
          "type": "uint256"
        },
        {
          "internalType": "address",
          "name": "initiator",
          "type": "address"
        },
        {
          "internalType": "bytes",
          "name": "params",
          "type": "bytes"
        }
      ],
      "name": "executeOperation",
      "outputs": [
        {
          "internalType": "bool",
          "name": "",
          "type": "bool"
        }
      ],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "lendingPool",
      "outputs": [
        {
          "internalType": "contract IPool",
          "name": "",
          "type": "address"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "_collateral",
          "type": "address"
        },
        {
          "internalType": "uint256",
          "name": "_baseAmount",
          "type": "uint256"
        },
        {
          "internalType": "address",
          "name": "_flashLoanAsset",
          "type": "address"
        },
        {
          "internalType": "uint256",
          "name": "_flashLoanAmount",
          "type": "uint256"
        },
        {
          "internalType": "address",
          "name": "_router",
          "type": "address"
        },
        {
          "internalType": "bytes",
          "name": "_swapCalldata",
          "type": "bytes"
        }
      ],
      "name": "openLeveragedPosition",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "owner",
      "outputs": [
        {
          "internalType": "address",
          "name": "",
          "type": "address"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "provider",
      "outputs": [
        {
          "internalType": "contract IPoolAddressesProvider",
          "name": "",
          "type": "address"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    }
  ]

export default flashloanReceiverABI;