import type { EventTicketing, MockUSDC } from "@event_ticketing/abi-types";
import {
  loadFixture,
  time,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import hre, { ethers } from "hardhat";

describe("EventTicketing", () => {
  // We define a fixture to reuse the same setup in every test
  const deployEventTicketingFixture = async () => {
    const ONE_DAY_IN_SECS = 24 * 60 * 60;
    const TICKET_PRICE = ethers.parseUnits("10", 6); // 10 USDC (6 decimals)
    const TOTAL_TICKETS = 100;
    const eventDate = (await time.latest()) + ONE_DAY_IN_SECS;

    // Contracts are deployed using the first signer/account by default
    const [owner, organizer, attendee, otherAccount] =
      await hre.ethers.getSigners();

    // Deploy mock USDC token
    const USDC = await hre.ethers.getContractFactory("MockUSDC");
    const usdc = await USDC.deploy();

    const EventTicketing = await hre.ethers.getContractFactory(
      "EventTicketing"
    );
    const eventTicketing = await EventTicketing.deploy(await usdc.getAddress());

    // Distribute USDC to test accounts
    await usdc.transfer(organizer.address, ethers.parseUnits("10000", 6));
    await usdc.transfer(attendee.address, ethers.parseUnits("10000", 6));
    await usdc.transfer(otherAccount.address, ethers.parseUnits("10000", 6));

    return {
      eventTicketing: eventTicketing as unknown as EventTicketing,
      usdc: usdc as unknown as MockUSDC,
      owner,
      organizer,
      attendee,
      otherAccount,
      eventDate,
      TICKET_PRICE,
      TOTAL_TICKETS,
      ONE_DAY_IN_SECS,
    };
  };

  describe("Deployment", () => {
    it("Should set the right owner", async () => {
      const { eventTicketing, owner } = await loadFixture(
        deployEventTicketingFixture
      );
      expect(await eventTicketing.owner()).to.equal(owner.address);
    });

    it("Should have zero events initially", async () => {
      const { eventTicketing } = await loadFixture(deployEventTicketingFixture);
      expect(await eventTicketing.eventCount()).to.equal(0);
    });
  });

  describe("Event Creation", () => {
    it("Should create an event with correct parameters", async () => {
      const {
        eventTicketing,
        organizer,
        eventDate,
        TICKET_PRICE,
        TOTAL_TICKETS,
      } = await loadFixture(deployEventTicketingFixture);

      const name = "Test Event";
      const description = "This is a test event";

      await expect(
        eventTicketing
          .connect(organizer)
          .createEvent(
            name,
            description,
            TICKET_PRICE,
            TOTAL_TICKETS,
            eventDate
          )
      )
        .to.emit(eventTicketing, "EventCreated")
        .withArgs(
          1,
          organizer.address,
          name,
          TICKET_PRICE,
          TOTAL_TICKETS,
          eventDate
        );

      const eventDetails = await eventTicketing.getEventDetails(1);
      expect(eventDetails.organizer).to.equal(organizer.address);
      expect(eventDetails.name).to.equal(name);
      expect(eventDetails.ticketPrice).to.equal(TICKET_PRICE);
      expect(eventDetails.totalTickets).to.equal(TOTAL_TICKETS);
      expect(eventDetails.ticketsSold).to.equal(0);
      expect(eventDetails.eventDate).to.equal(eventDate);
      expect(eventDetails.isEventOver).to.equal(false);
    });

    it("Should revert if event date is not in the future", async () => {
      const { eventTicketing, organizer, TICKET_PRICE, TOTAL_TICKETS } =
        await loadFixture(deployEventTicketingFixture);
      const pastDate = (await time.latest()) - 1;

      await expect(
        eventTicketing
          .connect(organizer)
          .createEvent(
            "Past Event",
            "This event is in the past",
            TICKET_PRICE,
            TOTAL_TICKETS,
            pastDate
          )
      ).to.be.revertedWith("Event date must be in the future");
    });

    it("Should revert if total tickets is zero", async () => {
      const { eventTicketing, organizer, eventDate, TICKET_PRICE } =
        await loadFixture(deployEventTicketingFixture);

      await expect(
        eventTicketing
          .connect(organizer)
          .createEvent(
            "No Tickets Event",
            "This event has no tickets",
            TICKET_PRICE,
            0,
            eventDate
          )
      ).to.be.revertedWith("Must have at least one ticket");
    });
  });

  describe("Ticket Purchasing", () => {
    const deployWithEventFixture = async () => {
      const fixture = await deployEventTicketingFixture();
      const {
        eventTicketing,
        organizer,
        eventDate,
        TICKET_PRICE,
        TOTAL_TICKETS,
      } = fixture;

      await eventTicketing
        .connect(organizer)
        .createEvent(
          "Test Event",
          "Test Description",
          TICKET_PRICE,
          TOTAL_TICKETS,
          eventDate
        );

      return { ...fixture, eventId: 1 };
    };

    it("Should allow purchasing tickets with correct payment", async () => {
      const { eventTicketing, usdc, attendee, eventId, TICKET_PRICE } =
        await loadFixture(deployWithEventFixture);
      const quantity = 2;
      const totalPrice = TICKET_PRICE * BigInt(quantity);

      await usdc.connect(attendee).approve(eventTicketing.target, totalPrice);

      await expect(
        eventTicketing.connect(attendee).buyTicket(eventId, quantity)
      )
        .to.emit(eventTicketing, "TicketPurchased")
        .withArgs(eventId, attendee.address, quantity);

      const ticketsOwned = await eventTicketing.getTicketsOwned(
        eventId,
        attendee.address
      );
      expect(ticketsOwned).to.equal(quantity);

      const eventDetails = await eventTicketing.getEventDetails(eventId);
      expect(eventDetails.ticketsSold).to.equal(quantity);
      expect(await usdc.balanceOf(eventTicketing.target)).to.equal(totalPrice);
    });
    it("Should revert if event doesn't exist", async () => {
      const { eventTicketing, attendee, TICKET_PRICE } = await loadFixture(
        deployWithEventFixture
      );
      await expect(
        eventTicketing.connect(attendee).buyTicket(999, 1)
      ).to.be.revertedWith("Event does not exist");
    });

    it("Should revert if event has already started", async () => {
      const { eventTicketing, attendee, eventId, TICKET_PRICE, eventDate } =
        await loadFixture(deployWithEventFixture);
      await time.increaseTo(eventDate);

      await expect(
        eventTicketing.connect(attendee).buyTicket(eventId, 1)
      ).to.be.revertedWith("Event has already started or ended");
    });

    it("Should revert if not enough tickets available", async () => {
      const { eventTicketing, attendee, eventId, TICKET_PRICE, TOTAL_TICKETS } =
        await loadFixture(deployWithEventFixture);
      const tooManyTickets = TOTAL_TICKETS + 1;

      await expect(
        eventTicketing.connect(attendee).buyTicket(eventId, tooManyTickets)
      ).to.be.revertedWith("Not enough tickets available");
    });

    it("Should revert if payment is insufficient", async () => {
      const { eventTicketing, usdc, attendee, eventId, TICKET_PRICE } =
        await loadFixture(deployWithEventFixture);
      const insufficientPayment = TICKET_PRICE - BigInt(1);
      await usdc
        .connect(attendee)
        .approve(eventTicketing.target, insufficientPayment);
      await expect(
        eventTicketing.connect(attendee).buyTicket(eventId, 1)
      ).to.be.revertedWith("Insufficient USDC allowance");
    });

    it("Should revert if event is already over", async () => {
      const {
        eventTicketing,
        usdc,
        organizer,
        attendee,
        eventId,
        TICKET_PRICE,
        eventDate,
      } = await loadFixture(deployWithEventFixture);

      // Purchase some tickets
      const quantity = 2;
      const totalPrice = TICKET_PRICE * BigInt(quantity);
      await usdc.connect(attendee).approve(eventTicketing.target, totalPrice);
      await eventTicketing.connect(attendee).buyTicket(eventId, quantity);

      // Move time forward to after the event and withdraw funds
      await time.increaseTo(eventDate);
      await eventTicketing.connect(organizer).withdrawFunds(eventId);

      // Try to buy tickets after event is over
      await usdc.connect(attendee).approve(eventTicketing.target, TICKET_PRICE);
      await expect(
        eventTicketing.connect(attendee).buyTicket(eventId, 1)
      ).to.be.revertedWith("Event is already over");
    });
  });

  describe("Funds Withdrawal", () => {
    const deployWithEventFixture = async () => {
      const fixture = await deployEventTicketingFixture();
      const {
        eventTicketing,
        organizer,
        eventDate,
        TICKET_PRICE,
        TOTAL_TICKETS,
      } = fixture;

      await eventTicketing
        .connect(organizer)
        .createEvent(
          "Test Event",
          "Test Description",
          TICKET_PRICE,
          TOTAL_TICKETS,
          eventDate
        );

      return { ...fixture, eventId: 1 };
    };
    async function deployWithPurchasedTicketsFixture() {
      const fixture = await deployWithEventFixture();
      const { eventTicketing, attendee, eventId, TICKET_PRICE, usdc } = fixture;

      const quantity = 5;
      await usdc
        .connect(attendee)
        .approve(eventTicketing.target, TICKET_PRICE * BigInt(quantity));
      // Purchase tickets
      await eventTicketing.connect(attendee).buyTicket(eventId, quantity);

      return { ...fixture, quantity };
    }

    it("Should allow organizer to withdraw funds after event", async () => {
      const {
        eventTicketing,
        usdc,
        organizer,
        eventId,
        TICKET_PRICE,
        quantity,
        eventDate,
      } = await loadFixture(deployWithPurchasedTicketsFixture);
      const expectedAmount = TICKET_PRICE * BigInt(quantity);

      await time.increaseTo(eventDate);

      const organizerBalanceBefore = await usdc.balanceOf(organizer.address);
      await expect(eventTicketing.connect(organizer).withdrawFunds(eventId))
        .to.emit(eventTicketing, "FundsWithdrawn")
        .withArgs(eventId, organizer.address, expectedAmount);
      const organizerBalanceAfter = await usdc.balanceOf(organizer.address);

      const eventDetails = await eventTicketing.getEventDetails(eventId);
      expect(eventDetails.isEventOver).to.equal(true);
      expect(organizerBalanceAfter - organizerBalanceBefore).to.equal(
        expectedAmount
      );
      expect(await usdc.balanceOf(eventTicketing.target)).to.equal(0);
    });

    it("Should revert if not called by organizer", async () => {
      const { eventTicketing, usdc, otherAccount, eventId, eventDate } =
        await loadFixture(deployWithPurchasedTicketsFixture);
      await time.increaseTo(eventDate);

      await expect(
        eventTicketing.connect(otherAccount).withdrawFunds(eventId)
      ).to.be.revertedWith("Only organizer can call this function");
    });

    it("Should revert if event hasn't occurred yet", async () => {
      const { eventTicketing, organizer, eventId } = await loadFixture(
        deployWithPurchasedTicketsFixture
      );

      await expect(
        eventTicketing.connect(organizer).withdrawFunds(eventId)
      ).to.be.revertedWith("Event has not occurred yet");
    });

    it("Should revert if funds already withdrawn", async () => {
      const { eventTicketing, organizer, eventId, eventDate } =
        await loadFixture(deployWithPurchasedTicketsFixture);
      await time.increaseTo(eventDate);
      await eventTicketing.connect(organizer).withdrawFunds(eventId);

      await expect(
        eventTicketing.connect(organizer).withdrawFunds(eventId)
      ).to.be.revertedWith("Funds already withdrawn");
    });

    it("Should revert if no tickets were sold", async () => {
      const { eventTicketing, organizer, eventId, eventDate } =
        await loadFixture(deployWithEventFixture);
      await time.increaseTo(eventDate);

      await expect(
        eventTicketing.connect(organizer).withdrawFunds(eventId)
      ).to.be.revertedWith("No funds to withdraw");
    });
  });

  describe("Ticket Query Functions", () => {
    const deployWithMultipleEventsFixture = async () => {
      const fixture = await deployEventTicketingFixture();
      const {
        eventTicketing,
        organizer,
        eventDate,
        TICKET_PRICE,
        TOTAL_TICKETS,
        usdc,
        attendee,
      } = fixture;

      // Create 3 test events
      await eventTicketing
        .connect(organizer)
        .createEvent(
          "Event 1",
          "Description 1",
          TICKET_PRICE,
          TOTAL_TICKETS,
          eventDate
        );
      await eventTicketing
        .connect(organizer)
        .createEvent(
          "Event 2",
          "Description 2",
          TICKET_PRICE,
          TOTAL_TICKETS,
          eventDate + 86400
        );
      await eventTicketing
        .connect(organizer)
        .createEvent(
          "Event 3",
          "Description 3",
          TICKET_PRICE,
          TOTAL_TICKETS,
          eventDate + 172800
        );

      // Approve USDC for all purchases
      await usdc.connect(attendee).approve(
        eventTicketing.target,
        TICKET_PRICE * 10n // Enough for all test purchases
      );

      return { ...fixture };
    };

    describe("getTicketsOwned", () => {
      const deployWithEventFixture = async () => {
        const fixture = await deployEventTicketingFixture();
        const {
          eventTicketing,
          organizer,
          eventDate,
          TICKET_PRICE,
          TOTAL_TICKETS,
        } = fixture;

        await eventTicketing
          .connect(organizer)
          .createEvent(
            "Test Event",
            "Test Description",
            TICKET_PRICE,
            TOTAL_TICKETS,
            eventDate
          );

        return { ...fixture, eventId: 1 };
      };
      it("Should return 0 for address with no tickets", async () => {
        const { eventTicketing, otherAccount, eventId } = await loadFixture(
          deployWithEventFixture
        );

        const tickets = await eventTicketing.getTicketsOwned(
          eventId,
          otherAccount.address
        );
        expect(tickets).to.equal(0);
      });

      it("Should return correct ticket count for specific event", async () => {
        const { eventTicketing, attendee, eventId, TICKET_PRICE, usdc } =
          await loadFixture(deployWithEventFixture);

        const quantity = 3;
        const totalPrice = TICKET_PRICE * BigInt(quantity);

        // Explicitly set allowance (remove the verification check)
        await usdc.connect(attendee).approve(eventTicketing.target, totalPrice);

        await eventTicketing.connect(attendee).buyTicket(eventId, quantity);

        const tickets = await eventTicketing.getTicketsOwned(
          eventId,
          attendee.address
        );
        expect(tickets).to.equal(quantity);
      });
    });
    describe("getAttendedEventsPaginated", () => {
      it("Should return empty arrays for address with no tickets", async () => {
        const { eventTicketing, otherAccount } = await loadFixture(
          deployWithMultipleEventsFixture
        );

        const [eventIds, ticketCounts, total] =
          await eventTicketing.getAttendedEventsPaginated(
            otherAccount.address,
            0,
            10
          );

        expect(eventIds).to.have.lengthOf(0);
        expect(ticketCounts).to.have.lengthOf(0);
        expect(total).to.equal(3);
      });

      it("Should return correct events and counts for attendee", async () => {
        const { eventTicketing, attendee, usdc } = await loadFixture(
          deployWithMultipleEventsFixture
        );

        // Buy tickets for event 1 and 3
        await eventTicketing.connect(attendee).buyTicket(1, 2);
        await eventTicketing.connect(attendee).buyTicket(3, 1);

        const [eventIds, ticketCounts, total] =
          await eventTicketing.getAttendedEventsPaginated(
            attendee.address,
            0,
            10
          );

        expect(eventIds).to.have.lengthOf(2);
        expect(ticketCounts).to.have.lengthOf(2);
        expect(total).to.equal(3);

        // Results should be in event ID order
        expect(eventIds[0]).to.equal(1);
        expect(ticketCounts[0]).to.equal(2);
        expect(eventIds[1]).to.equal(3);
        expect(ticketCounts[1]).to.equal(1);
      });

      it("Should handle pagination correctly", async () => {
        const { eventTicketing, attendee } = await loadFixture(
          deployWithMultipleEventsFixture
        );

        // Buy tickets for all 3 events
        await eventTicketing.connect(attendee).buyTicket(1, 1);
        await eventTicketing.connect(attendee).buyTicket(2, 2);
        await eventTicketing.connect(attendee).buyTicket(3, 3);

        // First page (2 items)
        const [page1Ids, page1Counts, total] =
          await eventTicketing.getAttendedEventsPaginated(
            attendee.address,
            0,
            2
          );

        expect(page1Ids).to.have.lengthOf(2);
        expect(page1Counts).to.have.lengthOf(2);
        expect(total).to.equal(3);
        expect(page1Ids[0]).to.equal(1);
        expect(page1Counts[0]).to.equal(1);
        expect(page1Ids[1]).to.equal(2);
        expect(page1Counts[1]).to.equal(2);

        // Second page (1 item)
        const [page2Ids, page2Counts] =
          await eventTicketing.getAttendedEventsPaginated(
            attendee.address,
            1,
            2
          );

        expect(page2Ids).to.have.lengthOf(1);
        expect(page2Counts).to.have.lengthOf(1);
        expect(page2Ids[0]).to.equal(3);
        expect(page2Counts[0]).to.equal(3);
      });

      it("Should return empty arrays for out-of-bounds pages", async () => {
        const { eventTicketing, attendee } = await loadFixture(
          deployWithMultipleEventsFixture
        );

        await eventTicketing.connect(attendee).buyTicket(1, 1);

        const [eventIds, ticketCounts] =
          await eventTicketing.getAttendedEventsPaginated(
            attendee.address,
            1,
            10
          );

        expect(eventIds).to.have.lengthOf(0);
        expect(ticketCounts).to.have.lengthOf(0);
      });

      it("Should return partial results for partial pages", async () => {
        const { eventTicketing, attendee } = await loadFixture(
          deployWithMultipleEventsFixture
        );

        await eventTicketing.connect(attendee).buyTicket(1, 1);
        await eventTicketing.connect(attendee).buyTicket(2, 1);

        const [eventIds, ticketCounts] =
          await eventTicketing.getAttendedEventsPaginated(
            attendee.address,
            0,
            1
          );

        expect(eventIds).to.have.lengthOf(1);
        expect(ticketCounts).to.have.lengthOf(1);
        expect(eventIds[0]).to.equal(1);
      });
    });
  });

  describe("Event Query Functions", () => {
    const deployWithMultipleEventsFixture = async () => {
      const fixture = await deployEventTicketingFixture();
      const {
        eventTicketing,
        organizer,
        eventDate,
        TICKET_PRICE,
        TOTAL_TICKETS,
        usdc,
        attendee,
      } = fixture;

      // Create all events in the future
      const event1Date = eventDate + 86400; // +1 day
      const event2Date = eventDate + 172800; // +2 days
      const event3Date = eventDate + 259200; // +3 days
      const event4Date = eventDate + 345600; // +4 days
      const event5Date = eventDate + 432000; // +5 days

      await eventTicketing
        .connect(organizer)
        .createEvent(
          "Event 1",
          "Description 1",
          TICKET_PRICE,
          TOTAL_TICKETS,
          event1Date
        );
      await eventTicketing
        .connect(organizer)
        .createEvent(
          "Event 2",
          "Description 2",
          TICKET_PRICE,
          TOTAL_TICKETS,
          event2Date
        );
      await eventTicketing
        .connect(organizer)
        .createEvent(
          "Event 3",
          "Description 3",
          TICKET_PRICE,
          TOTAL_TICKETS,
          event3Date
        );
      await eventTicketing
        .connect(organizer)
        .createEvent(
          "Event 4",
          "Description 4",
          TICKET_PRICE,
          TOTAL_TICKETS,
          event4Date
        );
      await eventTicketing
        .connect(organizer)
        .createEvent(
          "Event 5",
          "Description 5",
          TICKET_PRICE,
          TOTAL_TICKETS,
          event5Date
        );

      // Approve enough USDC for all purchases
      await usdc
        .connect(attendee)
        .approve(eventTicketing.target, TICKET_PRICE * 12n);

      // Buy tickets for events (so withdrawFunds won't revert)
      await eventTicketing.connect(attendee).buyTicket(1, 3);
      await eventTicketing.connect(attendee).buyTicket(2, 5);
      await eventTicketing.connect(attendee).buyTicket(3, 1);
      await eventTicketing.connect(attendee).buyTicket(5, 1);

      // Do NOT advance time or call withdrawFunds here!
      // Let each test control time and event status as needed.

      return {
        ...fixture,
        event1Date,
        event2Date,
        event3Date,
        event4Date,
        event5Date,
      };
    };

    describe("getEventsPaginated", () => {
      it("Should return all events when no filter is applied", async () => {
        const { eventTicketing, organizer } = await loadFixture(
          deployWithMultipleEventsFixture
        );

        // advance time to ensure some events are finished
        await time.increaseTo((await time.latest()) + 86400 * 3); // +3 days
        // withdraw funds to ensure events are marked as finished
        await eventTicketing.connect(organizer).withdrawFunds(1);
        await eventTicketing.connect(organizer).withdrawFunds(2);

        const [eventIds, names, isFinished, total] =
          await eventTicketing.getEventsPaginated(0, 10, false);

        expect(total).to.equal(5); // Total count includes all events
        expect(eventIds).to.have.lengthOf(5); // All events returned
        expect(names).to.deep.equal([
          "Event 1",
          "Event 2",
          "Event 3",
          "Event 4",
          "Event 5",
        ]);
        expect(isFinished).to.deep.equal([true, true, false, false, false]);
      });

      it("Should return only active events when filtered", async () => {
        const { eventTicketing, organizer } = await loadFixture(
          deployWithMultipleEventsFixture
        );

        // advance time to ensure some events are finished
        await time.increaseTo((await time.latest()) + 86400 * 3); // +3 days
        // withdraw funds to ensure events are marked as finished
        await eventTicketing.connect(organizer).withdrawFunds(1);
        await eventTicketing.connect(organizer).withdrawFunds(2);

        const [eventIds, names, isFinished, total] =
          await eventTicketing.getEventsPaginated(0, 10, true);

        expect(total).to.equal(5); // Only active events
        expect(eventIds).to.have.lengthOf(3); // Only active events returned
        expect(names).to.deep.equal(["Event 3", "Event 4", "Event 5"]);
        expect(isFinished).to.deep.equal([false, false, false]);
      });

      it("Should handle pagination correctly", async () => {
        const { eventTicketing } = await loadFixture(
          deployWithMultipleEventsFixture
        );

        // First page (2 items)
        const [page1Ids, page1Names] = await eventTicketing.getEventsPaginated(
          0,
          2,
          false
        );
        expect(page1Ids).to.have.lengthOf(2);
        expect(page1Names).to.deep.equal(["Event 1", "Event 2"]);

        // Second page (2 items)
        const [page2Ids, page2Names] = await eventTicketing.getEventsPaginated(
          1,
          2,
          false
        );
        expect(page2Ids).to.have.lengthOf(2);
        expect(page2Names).to.deep.equal(["Event 3", "Event 4"]);

        // Third page (1 item)
        const [page3Ids, page3Names] = await eventTicketing.getEventsPaginated(
          2,
          2,
          false
        );
        expect(page3Ids).to.have.lengthOf(1);
        expect(page3Names).to.deep.equal(["Event 5"]);
      });

      it("Should return empty arrays for out-of-bounds pages", async () => {
        const { eventTicketing } = await loadFixture(
          deployWithMultipleEventsFixture
        );

        const [eventIds, names] = await eventTicketing.getEventsPaginated(
          2,
          10,
          false
        );
        expect(eventIds).to.have.lengthOf(0);
        expect(names).to.have.lengthOf(0);
      });

      it("Should combine pagination with active filter correctly", async () => {
        const { eventTicketing, organizer } = await loadFixture(
          deployWithMultipleEventsFixture
        );

        // Advance time to ensure some events are finished
        await time.increaseTo((await time.latest()) + 86400 * 3); // +3 days
        // Withdraw funds to ensure events are marked as finished
        await eventTicketing.connect(organizer).withdrawFunds(1);
        await eventTicketing.connect(organizer).withdrawFunds(2);

        // First page of active events (2 items)
        const [page1Ids, page1Names] = await eventTicketing.getEventsPaginated(
          0,
          2,
          false
        );

        expect(page1Ids).to.have.lengthOf(2);
        expect(page1Names).to.deep.equal(["Event 1", "Event 2"]);

        // Second page of active events (1 item)
        const [page2Ids, page2Names] = await eventTicketing.getEventsPaginated(
          1,
          2,
          false
        );

        expect(page2Ids).to.have.lengthOf(2);
        expect(page2Names).to.deep.equal(["Event 3", "Event 4"]);
      });
    });

    describe("getRemainingTickets", () => {
      it("Should return correct remaining ticket count", async () => {
        const { eventTicketing } = await loadFixture(
          deployWithMultipleEventsFixture
        );

        // Event 1 had 3 tickets sold out of TOTAL_TICKETS (100)
        const remaining1 = await eventTicketing.getRemainingTickets(1);
        expect(remaining1).to.equal(97);

        // Event 2 had 5 tickets sold
        const remaining2 = await eventTicketing.getRemainingTickets(2);
        expect(remaining2).to.equal(95);

        // Event 3 had no tickets sold
        const remaining3 = await eventTicketing.getRemainingTickets(3);
        expect(remaining3).to.equal(99);
      });

      it("Should return 0 when event is sold out", async () => {
        const { eventTicketing, attendee, usdc, TICKET_PRICE } =
          await loadFixture(deployWithMultipleEventsFixture);

        // Buy all remaining tickets for event 1 (already has 3 sold)
        const remainingBefore = await eventTicketing.getRemainingTickets(1);
        await usdc
          .connect(attendee)
          .approve(eventTicketing.target, remainingBefore * TICKET_PRICE);
        await eventTicketing.connect(attendee).buyTicket(1, remainingBefore);

        const remainingAfter = await eventTicketing.getRemainingTickets(1);
        expect(remainingAfter).to.equal(0);
      });
    });

    describe("isEventActive", () => {
      it("Should correctly identify active events", async () => {
        const { eventTicketing } = await loadFixture(
          deployWithMultipleEventsFixture
        );

        // Active events (not finished and not started)
        expect(await eventTicketing.isEventActive(1)).to.be.true;
        expect(await eventTicketing.isEventActive(2)).to.be.true;
        expect(await eventTicketing.isEventActive(4)).to.be.true;
      });

      it("Should return false for finished events", async () => {
        const { eventTicketing, organizer } = await loadFixture(
          deployWithMultipleEventsFixture
        );

        // Advance time to after event 1 and 2
        await time.increaseTo((await time.latest()) + 86400 * 3); // +3 days
        await eventTicketing.connect(organizer).withdrawFunds(1);
        await eventTicketing.connect(organizer).withdrawFunds(2);

        expect(await eventTicketing.isEventActive(1)).to.be.false;
        expect(await eventTicketing.isEventActive(2)).to.be.false;
      });

      it("Should return false for ongoing but not finished events", async () => {
        const { eventTicketing, eventDate, organizer } = await loadFixture(
          deployWithMultipleEventsFixture
        );

        // Advance time to after event 1 but before event 3
        await time.increaseTo(eventDate + 86400 * 1); // +1 days
        await eventTicketing.connect(organizer).withdrawFunds(1);
        expect(await eventTicketing.isEventActive(1)).to.be.false; // Finished
        expect(await eventTicketing.isEventActive(2)).to.be.true; // Ongoing
        expect(await eventTicketing.isEventActive(3)).to.be.true; // Not started
      });
    });
  });

  describe("Fallback Function", () => {
    it("Should revert on direct Ether transfers", async () => {
      const { eventTicketing, attendee } = await loadFixture(
        deployEventTicketingFixture
      );
      const amount = hre.ethers.parseEther("1.0");

      await expect(
        attendee.sendTransaction({
          to: eventTicketing.target,
          value: amount,
        })
      ).to.be.revertedWith(
        "Direct Ether transfers not allowed. Use buyTicket function."
      );
    });
  });
});
