// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract EventTicketing {
    using SafeERC20 for IERC20;

    address public owner;
    IERC20 public usdcToken;

    struct Event {
        address organizer;
        string name;
        string description;
        uint256 ticketPrice;
        uint256 totalTickets;
        uint256 ticketsSold;
        uint256 eventDate;
        bool isEventOver;
        mapping(address => uint256) attendees;
    }

    uint256 public eventCount;
    mapping(uint256 => Event) public events;

    event EventCreated(
        uint256 eventId,
        address organizer,
        string name,
        uint256 ticketPrice,
        uint256 totalTickets,
        uint256 eventDate
    );
    event TicketPurchased(uint256 eventId, address attendee, uint256 quantity);
    event FundsWithdrawn(uint256 eventId, address organizer, uint256 amount);

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }

    modifier onlyOrganizer(uint256 _eventId) {
        require(
            events[_eventId].organizer == msg.sender,
            "Only organizer can call this function"
        );
        _;
    }

    modifier eventExists(uint256 _eventId) {
        require(
            _eventId <= eventCount && _eventId != 0,
            "Event does not exist"
        );
        _;
    }

    modifier eventNotOver(uint256 _eventId) {
        require(!events[_eventId].isEventOver, "Event is already over");
        _;
    }

    constructor(address _usdcAddress) {
        owner = msg.sender;
        usdcToken = IERC20(_usdcAddress);
    }

    function createEvent(
        string memory _name,
        string memory _description,
        uint256 _ticketPrice,
        uint256 _totalTickets,
        uint256 _eventDate
    ) external {
        require(
            _eventDate > block.timestamp,
            "Event date must be in the future"
        );
        require(_totalTickets > 0, "Must have at least one ticket");

        eventCount++;
        Event storage newEvent = events[eventCount];

        newEvent.organizer = msg.sender;
        newEvent.name = _name;
        newEvent.description = _description;
        newEvent.ticketPrice = _ticketPrice;
        newEvent.totalTickets = _totalTickets;
        newEvent.ticketsSold = 0;
        newEvent.eventDate = _eventDate;
        newEvent.isEventOver = false;

        emit EventCreated(
            eventCount,
            msg.sender,
            _name,
            _ticketPrice,
            _totalTickets,
            _eventDate
        );
    }

    function buyTicket(
        uint256 _eventId,
        uint256 _quantity
    ) external eventExists(_eventId) eventNotOver(_eventId) {
        Event storage eventToBuy = events[_eventId];

        require(
            block.timestamp < eventToBuy.eventDate,
            "Event has already started or ended"
        );
        require(
            eventToBuy.ticketsSold + _quantity <= eventToBuy.totalTickets,
            "Not enough tickets available"
        );

        uint256 totalPrice = eventToBuy.ticketPrice * _quantity;
        require(
            usdcToken.balanceOf(msg.sender) >= totalPrice,
            "Insufficient USDC balance"
        );
        require(
            usdcToken.allowance(msg.sender, address(this)) >= totalPrice,
            "Insufficient USDC allowance"
        );

        usdcToken.safeTransferFrom(msg.sender, address(this), totalPrice);

        eventToBuy.ticketsSold += _quantity;
        eventToBuy.attendees[msg.sender] += _quantity;

        emit TicketPurchased(_eventId, msg.sender, _quantity);
    }

    function withdrawFunds(
        uint256 _eventId
    ) external eventExists(_eventId) onlyOrganizer(_eventId) {
        Event storage eventToWithdraw = events[_eventId];

        require(
            block.timestamp >= eventToWithdraw.eventDate,
            "Event has not occurred yet"
        );
        require(!eventToWithdraw.isEventOver, "Funds already withdrawn");

        uint256 balance = eventToWithdraw.ticketPrice *
            eventToWithdraw.ticketsSold;
        require(balance > 0, "No funds to withdraw");

        eventToWithdraw.isEventOver = true;

        usdcToken.safeTransfer(eventToWithdraw.organizer, balance);

        emit FundsWithdrawn(_eventId, eventToWithdraw.organizer, balance);
    }

    function getEventDetails(
        uint256 _eventId
    )
        external
        view
        eventExists(_eventId)
        returns (
            address organizer,
            string memory name,
            string memory description,
            uint256 ticketPrice,
            uint256 totalTickets,
            uint256 ticketsSold,
            uint256 eventDate,
            bool isEventOver
        )
    {
        Event storage e = events[_eventId];
        return (
            e.organizer,
            e.name,
            e.description,
            e.ticketPrice,
            e.totalTickets,
            e.ticketsSold,
            e.eventDate,
            e.isEventOver
        );
    }

    function getTicketsOwned(
        uint256 _eventId,
        address _attendee
    ) external view eventExists(_eventId) returns (uint256) {
        return events[_eventId].attendees[_attendee];
    }

    function getAttendedEventsPaginated(
        address _attendee,
        uint256 _page,
        uint256 _pageSize
    )
        external
        view
        returns (
            uint256[] memory eventIds,
            uint256[] memory ticketCounts,
            uint256 totalEvents
        )
    {
        uint256 start = _page * _pageSize + 1; // Event IDs start at 1
        uint256 end = start + _pageSize;

        // Prevent overflow
        if (end > eventCount + 1) {
            end = eventCount + 1;
        }

        // Temporary arrays
        uint256[] memory tmpEventIds = new uint256[](_pageSize);
        uint256[] memory tmpCounts = new uint256[](_pageSize);
        uint256 found = 0;

        // Scan only the target page range
        for (uint256 i = start; i < end; i++) {
            uint256 tickets = events[i].attendees[_attendee];
            if (tickets > 0) {
                tmpEventIds[found] = i;
                tmpCounts[found] = tickets;
                found++;
            }
        }

        // Copy only relevant results
        eventIds = new uint256[](found);
        ticketCounts = new uint256[](found);
        for (uint256 j = 0; j < found; j++) {
            eventIds[j] = tmpEventIds[j];
            ticketCounts[j] = tmpCounts[j];
        }

        return (eventIds, ticketCounts, eventCount);
    }

    receive() external payable {
        revert("Direct Ether transfers not allowed. Use buyTicket function.");
    }
}
