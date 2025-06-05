import { ethers } from "hardhat";

async function main() {
  const MockUSDC = await ethers.getContractFactory("MockUSDC");
  const usdc = await MockUSDC.deploy();
  await usdc.waitForDeployment();
  console.log(`MockUSDC deployed to: ${await usdc.getAddress()}`);

  const EventTicketing = await ethers.getContractFactory("EventTicketing");
  const eventTicketing = await EventTicketing.deploy(await usdc.getAddress());
  await eventTicketing.waitForDeployment();

  console.log(
    `EventTicketing deployed to: ${await eventTicketing.getAddress()}`
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
