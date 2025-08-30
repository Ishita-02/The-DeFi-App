const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying with:", deployer.address);

  const AAVE_POOL = "0x2f39d218133AFaB8F2B819B1066c7E434Ad94E9e";

  const FlashloanReceiver = await hre.ethers.getContractFactory("FlashLoanReceiver");
  const contract = await FlashloanReceiver.deploy(AAVE_POOL);
  await contract.waitForDeployment();
  console.log("contract", contract);

  console.log("FlashloanReceiver deployed at:", contract.target);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

