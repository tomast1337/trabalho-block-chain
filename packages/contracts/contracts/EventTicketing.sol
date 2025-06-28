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
        bool isCanceled;
        mapping(address => uint256) attendees;
    }

    uint256 public eventCount;
    mapping(uint256 => Event) public events;

    struct EventInfo {
        uint256 id;
        address organizer;
        string name;
        string description;
        uint256 ticketPrice;
        uint256 totalTickets;
        uint256 ticketsSold;
        uint256 eventDate;
        bool isEventOver;
        bool isCanceled;
    }

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
    event EventCanceled(uint256 eventId);
    event TicketRefunded(uint256 eventId, address attendee, uint256 amount);

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
        require(!events[_eventId].isCanceled, "Event is canceled");
        _;
    }

    function setOwner(address _newOwner) external onlyOwner {
        owner = _newOwner;
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
        newEvent.isCanceled = false;

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

    function cancelEvent(
        uint256 _eventId
    ) external eventExists(_eventId) onlyOrganizer(_eventId) {
        Event storage e = events[_eventId];
        require(!e.isEventOver, "Event is already over");
        require(!e.isCanceled, "Event already canceled");
        e.isCanceled = true;
        emit EventCanceled(_eventId);
    }

    function withdrawFunds(
        uint256 _eventId
    ) external eventExists(_eventId) onlyOrganizer(_eventId) {
        Event storage eventToWithdraw = events[_eventId];
        require(!eventToWithdraw.isCanceled, "Event is canceled");
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

    function refundTicket(uint256 _eventId) external eventExists(_eventId) {
        Event storage e = events[_eventId];
        require(e.isCanceled, "Event is not canceled");
        uint256 tickets = e.attendees[msg.sender];
        require(tickets > 0, "No tickets to refund");
        uint256 refundAmount = e.ticketPrice * tickets;
        e.ticketsSold -= tickets;
        e.attendees[msg.sender] = 0;
        usdcToken.safeTransfer(msg.sender, refundAmount);
        emit TicketRefunded(_eventId, msg.sender, refundAmount);
    }

    function getEventDetails(
        uint256 _eventId
    ) external view eventExists(_eventId) returns (EventInfo memory) {
        Event storage e = events[_eventId];
        return
            EventInfo({
                id: _eventId,
                organizer: e.organizer,
                name: e.name,
                description: e.description,
                ticketPrice: e.ticketPrice,
                totalTickets: e.totalTickets,
                ticketsSold: e.ticketsSold,
                eventDate: e.eventDate,
                isEventOver: e.isEventOver,
                isCanceled: e.isCanceled
            });
    }

    function getTicketsOwned(
        uint256 _eventId,
        address _attendee
    ) external view eventExists(_eventId) returns (uint256) {
        return events[_eventId].attendees[_attendee];
    }

    function getAttendedEventsPaginated(
        address _attendee, // Address of the attendee
        uint256 _page, // Page number starting from 0
        uint256 _pageSize // Number of events per page
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

    function getEventsPaginated(
        uint256 _page,
        uint256 _pageSize,
        bool _onlyActive
    ) external view returns (EventInfo[] memory, uint256) {
        uint256 start = _page * _pageSize + 1;
        uint256 end = start + _pageSize;

        if (end > eventCount + 1) {
            end = eventCount + 1;
        }

        EventInfo[] memory infos = new EventInfo[](
            end > start ? end - start : 0
        );
        uint256 count = 0;

        for (uint256 i = start; i < end; i++) {
            if (
                !_onlyActive ||
                (!events[i].isEventOver && !events[i].isCanceled)
            ) {
                Event storage e = events[i];
                infos[count] = EventInfo({
                    id: i,
                    organizer: e.organizer,
                    name: e.name,
                    description: e.description,
                    ticketPrice: e.ticketPrice,
                    totalTickets: e.totalTickets,
                    ticketsSold: e.ticketsSold,
                    eventDate: e.eventDate,
                    isEventOver: e.isEventOver,
                    isCanceled: e.isCanceled
                });
                count++;
            }
        }

        if (count < infos.length) {
            EventInfo[] memory result = new EventInfo[](count);
            for (uint256 i = 0; i < count; i++) {
                result[i] = infos[i];
            }
            return (result, eventCount);
        }

        return (infos, eventCount);
    }

    function getEventsByOrganizer(
        address _organizer
    ) external view returns (EventInfo[] memory) {
        uint256 totalUserEvents = 0;
        for (uint256 i = 1; i <= eventCount; i++) {
            if (events[i].organizer == _organizer) {
                totalUserEvents++;
            }
        }

        EventInfo[] memory userEvents = new EventInfo[](totalUserEvents);
        uint256 currentUserEventIndex = 0;
        for (uint256 i = 1; i <= eventCount; i++) {
            if (events[i].organizer == _organizer) {
                Event storage e = events[i];
                userEvents[currentUserEventIndex] = EventInfo({
                    id: i,
                    organizer: e.organizer,
                    name: e.name,
                    description: e.description,
                    ticketPrice: e.ticketPrice,
                    totalTickets: e.totalTickets,
                    ticketsSold: e.ticketsSold,
                    eventDate: e.eventDate,
                    isEventOver: e.isEventOver,
                    isCanceled: e.isCanceled
                });
                currentUserEventIndex++;
            }
        }
        return userEvents;
    }

    // Returns remaining tickets
    function getRemainingTickets(
        uint256 _eventId
    ) external view returns (uint256) {
        Event storage e = events[_eventId];
        return e.totalTickets - e.ticketsSold;
    }

    // Returns if event is active (not over and not started)
    function isEventActive(uint256 _eventId) external view returns (bool) {
        Event storage e = events[_eventId];
        return !e.isEventOver && block.timestamp < e.eventDate;
    }

    receive() external payable {
        revert("Direct Ether transfers not allowed. Use buyTicket function.");
    }
}
