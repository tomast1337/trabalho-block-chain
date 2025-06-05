import { ethers } from "hardhat";

async function main() {
  const [deployer, ...otherAccounts] = await ethers.getSigners();
  const usdcAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3"; // Replace with deployed MockUSDC address
  const USDC = await ethers.getContractFactory("MockUSDC");
  const usdc = await USDC.attach(usdcAddress);

  const code = await ethers.provider.getCode(usdcAddress);
  if (code === "0x") {
    throw new Error(`No contract deployed at ${usdcAddress}`);
  }

  const amount = ethers.parseUnits("1000", 6); // 1000 USDC per account
  console.log("Distributing USDC to accounts...");

  for (const account of otherAccounts.slice(0, 5)) {
    // Distribute to first 5 accounts
    console.log(`Transferring 1000 USDC to ${account.address}`);
    await usdc.transfer(account.address, amount);
    console.log(
      `Balance of ${account.address}: ${(
        await usdc.balanceOf(account.address)
      ).toString()}`
    );
  }

  console.log("Distribution complete");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
