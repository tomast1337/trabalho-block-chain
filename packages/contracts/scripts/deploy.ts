import { fakerUK as faker } from "@faker-js/faker";
import { ethers } from "hardhat";
import {
  EventTicketing__factory,
  EventTicketing,
  MockUSDC__factory,
  MockUSDC,
} from "@event_ticketing/abi-types/src/";

// Types for better code organization
type EventParams = {
  name: string;
  description: string;
  date: number;
  ticketPrice: string;
  maxTickets: number;
};

// Event type suffixes with weights
const EVENT_TYPES = [
  { name: "Event", weight: 3 },
  { name: "Concert", weight: 2 },
  { name: "Festival", weight: 1 },
  { name: "Conference", weight: 2 },
  { name: "Workshop", weight: 2 },
  { name: "Exhibition", weight: 1 },
  { name: "Meetup", weight: 2 },
  { name: "Seminar", weight: 1 },
  { name: "Show", weight: 1 },
  { name: "Premiere", weight: 1 },
];

// Helper function to get random event type
const getEventType = () => {
  const weightedTypes = EVENT_TYPES.flatMap((type) =>
    Array(type.weight).fill(type.name)
  );
  return faker.helpers.arrayElement(weightedTypes);
};

// Helper function to get future timestamp with buffer
const getFutureTimestamp = (daysInFuture: number = 7) => {
  const now = Math.floor(Date.now() / 1000);
  const minBuffer = 300; // 5 minutes in seconds
  const dayBuffer = 60 * 60 * 24 * daysInFuture;
  return now + minBuffer + dayBuffer;
};

// Generate realistic event data
const generateEventData = (): EventParams => {
  const baseName = faker.commerce.productName();
  const eventType = getEventType();
  const eventName = `${baseName} - ${eventType}`;

  return {
    name: eventName,
    description: faker.lorem.paragraphs(2),
    date: getFutureTimestamp(faker.number.int({ min: 1, max: 180 })), // 1-180 days in future
    ticketPrice: faker.number
      .int({
        min: 10 * 10,
        max: 200 * 100,
      })
      .toString(),
    maxTickets: faker.helpers.arrayElement([
      50, 100, 200, 500, 1000, 2000, 5000,
    ]),
  };
};

async function deployContracts(deployer: any) {
  console.log("🚀 Deploying contracts...");

  // Deploy MockUSDC
  const MockUSDC = await new MockUSDC__factory(deployer);
  const usdc = await MockUSDC.deploy();
  await usdc.waitForDeployment();
  const address = await usdc.getAddress();
  console.log(`✅ MockUSDC deployed to: ${address}`);

  // Deploy EventTicketing
  const EventTicketing = new EventTicketing__factory(deployer);
  const eventTicketing = await EventTicketing.deploy(await usdc.getAddress());
  await eventTicketing.waitForDeployment();
  console.log(
    `✅ EventTicketing deployed to: ${await eventTicketing.getAddress()}`
  );

  return {
    usdc,
    eventTicketing,
  } as {
    usdc: MockUSDC;
    eventTicketing: EventTicketing;
  };
}

async function distributeTokens(usdc: MockUSDC, accounts: any[]) {
  console.log("💰 Distributing USDC to accounts...");
  const amount = ethers.parseUnits("1000", 6); // 1000 USDC

  for (const account of accounts) {
    if (account.address !== (await usdc.getAddress())) {
      try {
        const tx = await usdc.transfer(account.address, amount);
        await tx.wait();
        console.log(`✔ Transferred 1000 USDC to ${account.address}`);
      } catch (error) {
        console.error(`❌ Failed to transfer to ${account.address}:`, error);
      }
    }
  }
}

async function createSampleEvents(
  eventTicketing: EventTicketing,
  accounts: any[]
) {
  console.log("🎭 Creating sample events...");
  const organizers = accounts.slice(0, 5);

  // Get current block timestamp first
  const latestBlock = await ethers.provider.getBlock("latest");
  if (!latestBlock) {
    throw new Error("Could not get the latest block");
  }
  const currentBlockTimestamp = BigInt(latestBlock.timestamp);
  console.log(`⏱ Current block timestamp: ${currentBlockTimestamp}`);

  for (const organizer of organizers) {
    const num_events = faker.number.int({ min: 2, max: 6 });
    for (let i = 0; i < num_events; i++) {
      const eventData = generateEventData();

      try {
        // Ensure the date is in the future relative to blockchain time
        const eventTimestamp =
          currentBlockTimestamp +
          BigInt(60 * 60 * 24 * 7) + // 7 days in future
          BigInt(faker.number.int({ min: 1, max: 180 }) * 24 * 60 * 60) + // add between 1 and 180 days
          BigInt(300); // 5-minute buffer

        console.log(
          `⏳ Creating event with date: ${new Date(
            Number(eventTimestamp) * 1000
          ).toLocaleString()}`
        );

        const tx = await eventTicketing
          .connect(organizer)
          .createEvent(
            eventData.name,
            eventData.description,
            ethers.parseUnits(eventData.ticketPrice, 6),
            eventData.maxTickets,
            eventTimestamp
          );

        await tx.wait();
        console.log(
          `🎟 Created event: ${eventData.name}, 📅 ${new Date(
            Number(eventTimestamp) * 1000
          ).toLocaleDateString()}, 💵 $${eventData.ticketPrice} USDC, 🎫 ${
            eventData.maxTickets
          } tickets available, 👤 Organizer: ${organizer.address}\n`
        );
      } catch (error: unknown) {
        console.error(
          `❌ Failed to create event for ${organizer.address}:`,
          error instanceof Error ? error.message : String(error)
        );
      }
    }
  }
}

async function simulateTicketPurchases(
  eventTicketing: EventTicketing,
  usdc: MockUSDC,
  accounts: any[]
) {
  console.log("🎫 Simulating ticket purchases...");

  // Get all events
  const eventCount = await eventTicketing.eventCount();
  console.log(`📊 Found ${eventCount} events to simulate purchases for`);

  // Use accounts as buyers (excluding the first 5 which are organizers)
  const buyers = accounts.slice(5);

  if (buyers.length === 0) {
    console.log("⚠️ No buyer accounts available for simulation");
    return;
  }

  for (let eventId = 1; eventId <= eventCount; eventId++) {
    try {
      const eventDetails = await eventTicketing.getEventDetails(eventId);

      // Skip events that are already sold out or have no tickets
      if (eventDetails.ticketsSold >= eventDetails.totalTickets) {
        console.log(
          `⏭️ Event ${eventId} (${eventDetails.name}) is sold out, skipping...`
        );
        continue;
      }

      console.log(
        `\n🎭 Simulating purchases for Event ${eventId}: ${eventDetails.name}`
      );
      console.log(
        `💰 Ticket Price: ${ethers.formatUnits(
          eventDetails.ticketPrice,
          6
        )} USDC`
      );
      console.log(
        `🎫 Available: ${
          eventDetails.totalTickets - eventDetails.ticketsSold
        }/${eventDetails.totalTickets}`
      );

      // Simulate multiple buyers for this event
      const numBuyers = faker.number.int({
        min: 2,
        max: Math.min(buyers.length, 8),
      });
      const selectedBuyers = faker.helpers.arrayElements(buyers, numBuyers);

      for (const buyer of selectedBuyers) {
        try {
          // Random quantity between 1 and 4 tickets
          const quantity = faker.number.int({ min: 1, max: 4 });

          // Check if buyer has enough balance and allowance
          const buyerBalance = await usdc.balanceOf(buyer.address);
          const buyerAllowance = await usdc.allowance(
            buyer.address,
            await eventTicketing.getAddress()
          );
          const totalPrice = eventDetails.ticketPrice * BigInt(quantity);

          if (buyerBalance < totalPrice) {
            console.log(
              `💸 ${buyer.address} insufficient balance for ${quantity} tickets`
            );
            continue;
          }

          // Approve USDC spending if needed
          if (buyerAllowance < totalPrice) {
            const approveTx = await usdc
              .connect(buyer)
              .approve(await eventTicketing.getAddress(), totalPrice);
            await approveTx.wait();
          }

          // Purchase tickets
          const purchaseTx = await eventTicketing
            .connect(buyer)
            .buyTicket(eventId, quantity);
          await purchaseTx.wait();

          console.log(
            `✅ ${
              buyer.address
            } bought ${quantity} ticket(s) for ${ethers.formatUnits(
              totalPrice,
              6
            )} USDC`
          );

          // Add some randomness to make it more realistic
          if (faker.datatype.boolean(0.3)) {
            // 30% chance to skip some purchases
            break;
          }
        } catch (error: unknown) {
          console.error(
            `❌ Failed to purchase tickets for ${buyer.address}:`,
            error instanceof Error ? error.message : String(error)
          );
        }
      }

      // Get updated event details
      const updatedEventDetails = await eventTicketing.getEventDetails(eventId);
      console.log(
        `📈 Event ${eventId} now has ${updatedEventDetails.ticketsSold}/${updatedEventDetails.totalTickets} tickets sold`
      );
    } catch (error: unknown) {
      console.error(
        `❌ Failed to process event ${eventId}:`,
        error instanceof Error ? error.message : String(error)
      );
    }
  }

  console.log("\n🎉 Ticket purchase simulation completed!");
}

async function main() {
  try {
    const [deployer, ...accounts] = await ethers.getSigners();
    console.log(`🔷 Using deployer: ${deployer.address}`);

    // Deploy contracts
    const { usdc, eventTicketing } = await deployContracts(deployer);

    // Distribute tokens to all accounts
    await distributeTokens(usdc, [deployer, ...accounts]);

    // Create sample events
    await createSampleEvents(eventTicketing, [deployer, ...accounts]);

    // Simulate ticket purchases
    await simulateTicketPurchases(eventTicketing, usdc, [
      deployer,
      ...accounts,
    ]);

    console.log("✨ Deployment and setup completed successfully!");
  } catch (error) {
    console.error("⚠️ Deployment failed:", error);
    process.exitCode = 1;
  }
}

main();
