import { expect } from "chai";
import { ethers } from "hardhat";
import { EventTicketing } from "@abi-types/EventTicketing";

describe("EventTicketing", function () {
  let eventTicketing: EventTicketing;
  let owner: any, organizer: any, attendee: any;

  beforeEach(async function () {
    [owner, organizer, attendee] = await ethers.getSigners();
    const EventTicketing = await ethers.getContractFactory("EventTicketing");
    eventTicketing = await EventTicketing.deploy();
    await eventTicketing.waitForDeployment();
  });

  it("Should create an event", async function () {
    const eventDate = Math.floor(Date.now() / 1000) + 86400;
    await eventTicketing.connect(organizer).createEvent(
      "Test Event",
      "This is a test event",
      ethers.parseEther("0.1"), // Changed from utils.parseEther
      100,
      eventDate
    );

    const event = await eventTicketing.getEventDetails(1);
    expect(event.name).to.equal("Test Event");
  });
});
