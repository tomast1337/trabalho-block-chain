import { expect } from "chai";
import { ethers } from "hardhat";
import { EventTicketing } from "@abi-types/EventTicketing";

describe("EventTicketing", function () {
  let eventTicketing: EventTicketing;
  let owner: any, organizer: any, attendee: any;

  beforeEach(async function () {
    [owner, organizer, attendee] = await ethers.getSigners();
    const EventTicketingFactory = await ethers.getContractFactory(
      "EventTicketing"
    );
    const deployed = await EventTicketingFactory.deploy();
    await deployed.waitForDeployment();
  });

  it("Should create an event", async function () {
    const eventDate = Math.floor(Date.now() / 1000) + 86400; // 1 day in the future
    await eventTicketing
      .connect(organizer)
      .createEvent(
        "Test Event",
        "This is a test event",
        ethers.parseEther("0.1"),
        100,
        eventDate
      );

    const event = await eventTicketing.getEventDetails(1);
    expect(event.name).to.equal("Test Event");
  });
});
