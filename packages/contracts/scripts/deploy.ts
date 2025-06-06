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

  // Get test accounts
  const [owner, organizer, attendee, otherAccount] = await ethers.getSigners();

  // Distribute USDC to test accounts
  const amount = ethers.parseUnits("1000", 6);
  await usdc.transfer(organizer.address, amount);
  await usdc.transfer(attendee.address, amount);
  await usdc.transfer(otherAccount.address, amount);

  console.log("Distributed USDC to test accounts");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
