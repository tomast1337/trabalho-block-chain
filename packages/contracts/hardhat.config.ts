import "@nomicfoundation/hardhat-toolbox";
import "@typechain/hardhat";
import "dotenv/config";
import "hardhat-gas-reporter";
import { HardhatUserConfig } from "hardhat/config";
import "solidity-coverage";

const config: HardhatUserConfig = {
  solidity: "0.8.28",
  typechain: {
    outDir: "../abi-types/src",
    target: "ethers-v5",
  },
  gasReporter: {
    enabled: process.env.REPORT_GAS === "true",
    currency: "USD",
  },
};

export default config;
