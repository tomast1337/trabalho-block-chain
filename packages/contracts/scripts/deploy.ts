import { ethers } from "hardhat";

async function main() {
  const EventTicketing = await ethers.getContractFactory("EventTicketing");
  const eventTicketing = await EventTicketing.deploy();

  await eventTicketing.waitForDeployment();

  console.log(
    `EventTicketing deployed to: ${await eventTicketing.getAddress()}`
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
