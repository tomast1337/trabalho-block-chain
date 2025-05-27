import { ethers } from "hardhat";

async function main() {
  const EventTicketing = await ethers.getContractFactory("EventTicketing");
  const eventTicketing = await EventTicketing.deploy();

  await eventTicketing.deployed();

  console.log(`EventTicketing deployed to: ${eventTicketing.address}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
