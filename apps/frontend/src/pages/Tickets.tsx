import { Badge } from "@/components/ui/badge";
import { useEventTicketing } from "@event_ticketing/blockchain-access";
import { Loader2, TicketIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { EventCard, type Event } from "../components/EventList/EventCard";
import { WalletInfo } from "../components/WalletInfo";

type AttendedEvent = Event & {
  ticketsOwned: bigint;
};

// Tickets List Component
const TicketsList: React.FC<{
  attendedEvents: AttendedEvent[];
  eventsLoading: boolean;
  userAddress?: string;
}> = ({ attendedEvents, eventsLoading, userAddress }) => {
  return (
    <section className="w-full">
      <h2 className="text-2xl font-bold text-center mb-6">Your Tickets</h2>
      {eventsLoading && (
        <div className="flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
        </div>
      )}
      {!eventsLoading && attendedEvents.length === 0 && (
        <p className="text-center text-gray-500">
          You do not have any tickets yet.
        </p>
      )}
      <div className="max-w-[900px] mx-auto">
        {attendedEvents.map((event) => (
          <div key={event.id.toString()} className="relative">
            <EventCard
              event={event}
              showBuyButton={false}
              userAddress={userAddress}
              ticketsOwned={event.ticketsOwned}
            />
            <Badge className="absolute -top-3 -right-3 flex items-center gap-1">
              <TicketIcon className="h-4 w-4" />
              {event.ticketsOwned.toString()}
            </Badge>
          </div>
        ))}
      </div>
    </section>
  );
};

export const Tickets: React.FC = () => {
  const { eventTicketing, signer } = useEventTicketing();

  const [attendedEvents, setAttendedEvents] = useState<AttendedEvent[]>([]);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [, setError] = useState<string | null>(null);
  const [page] = useState(0);
  const [pageSize] = useState(50);
  const [userAddress, setUserAddress] = useState<string | undefined>();

  useEffect(() => {
    const getUserAddress = async () => {
      if (signer) {
        try {
          const address = await signer.getAddress();
          setUserAddress(address);
        } catch (error) {
          console.error("Error getting user address:", error);
        }
      }
    };
    getUserAddress();
  }, [signer]);

  useEffect(() => {
    const fetchAttendedEvents = async () => {
      if (!eventTicketing || !signer) return;

      try {
        setEventsLoading(true);
        const userAddress = await signer.getAddress();
        const [eventIds, ticketCounts] =
          await eventTicketing.getAttendedEventsPaginated(
            userAddress,
            page,
            pageSize
          );

        const attendedEventsPromises = eventIds.map(async (eventId, index) => {
          const eventDetails = await eventTicketing.getEventDetails(eventId);

          // Map the array response to the expected Event object structure
          // Based on the console log, the array structure is:
          // [id, organizer, name, description, ticketPrice, totalTickets, ticketsSold, eventDate, isEventOver, isCanceled]
          const eventObject = {
            id: eventId,
            organizer: eventDetails[1], // organizer address
            name: eventDetails[2], // event name
            description: eventDetails[3], // description
            ticketPrice: eventDetails[4], // ticket price
            totalTickets: eventDetails[5], // total tickets
            ticketsSold: eventDetails[6], // tickets sold
            eventDate: eventDetails[7], // event date
            isEventOver: eventDetails[8], // is event over
            isCanceled: eventDetails[9] || false, // is canceled (default to false)
          };

          return {
            ...eventObject,
            ticketsOwned: ticketCounts[index],
          };
        });

        const newAttendedEvents = await Promise.all(attendedEventsPromises);
        console.log("Fetched attended events:", newAttendedEvents);
        setAttendedEvents(newAttendedEvents);
      } catch (err) {
        console.error("Error fetching attended events:", err);
        setError("Failed to fetch your tickets.");
      } finally {
        setEventsLoading(false);
      }
    };

    fetchAttendedEvents();
  }, [signer, eventTicketing, page, pageSize]);

  return (
    <div className="flex-grow flex flex-col items-center p-4">
      <WalletInfo />
      <TicketsList
        attendedEvents={attendedEvents}
        eventsLoading={eventsLoading}
        userAddress={userAddress}
      />
    </div>
  );
};
