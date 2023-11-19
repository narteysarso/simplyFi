const { ethers } = require("hardhat");
require("dotenv").config();
const hre = require("hardhat");

async function main() {

  const splitContract = await ethers.getContractFactory("SimplyFiSplit");

  const deploySplit = await splitContract.deploy(process.env.OWNER_ADDRESS);

  await deploySplit.deployed();

  storeContractData(deploySplit, "SimplyFiSplit");


  console.log(`
  SimplyFiSplit contract at: ${deployedSlice.address}
  `);
}

const storeContractData = (contract, contractName) => {
  const fs = require("fs");
  const contractDir = `${__dirname}/../abis`;

  if (!fs.existsSync(contractDir)) {
    fs.mkdirSync(contractDir);
  }

  const contractArtiacts = artifacts.readArtifactSync(contractName);

  fs.writeFileSync(
    contractDir + `/${contractName}.json`,
    JSON.stringify({ address: contract.address, ...contractArtiacts }, null, 2)
  );
};

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error); ``
  process.exitCode = 1;
});
