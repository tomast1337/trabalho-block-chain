import { useContracts } from "@event_ticketing/blockchain-access";
import { formatUnits } from "ethers";
import { Loader2, TicketIcon, WalletIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { type Event, EventCard } from "../components/EventList/EventCard";
import { Badge } from "@/components/ui/badge";

type AttendedEvent = Event & {
  ticketsOwned: bigint;
};

export const Tickets: React.FC = () => {
  const { usdt, eventTicketing, signer } = useContracts();
  const [balance, setBalance] = useState<string | null>(null);
  const [address, setAddress] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [attendedEvents, setAttendedEvents] = useState<AttendedEvent[]>([]);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [page] = useState(0);
  const [pageSize] = useState(50);

  useEffect(() => {
    const fetchWalletData = async () => {
      if (signer && usdt) {
        try {
          setIsLoading(true);
          const userAddress = await signer.getAddress();
          const balance = await usdt.balanceOf(userAddress);
          setAddress(userAddress);
          setBalance(formatUnits(balance, 6));
        } catch (err) {
          console.error("Error fetching balance:", err);
          setError("Failed to fetch balance");
        } finally {
          setIsLoading(false);
        }
      }
    };

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
          return {
            ...eventDetails,
            id: eventId,
            ticketsOwned: ticketCounts[index],
          };
        });

        const newAttendedEvents = await Promise.all(attendedEventsPromises);
        setAttendedEvents(newAttendedEvents);
      } catch (err) {
        console.error("Error fetching attended events:", err);
        setError("Failed to fetch your tickets.");
      } finally {
        setEventsLoading(false);
      }
    };

    fetchWalletData();
    fetchAttendedEvents();
  }, [signer, usdt, eventTicketing, page, pageSize]);

  return (
    <div className="flex-grow flex flex-col items-center p-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow-md p-6 mb-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <WalletIcon className="h-6 w-6 text-indigo-500" />
            Your Wallet
          </h1>
          {address && (
            <span className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-600">
              {`${address.slice(0, 6)}...${address.slice(-4)}`}
            </span>
          )}
        </div>

        <div className="bg-indigo-50 rounded-lg p-4">
          <div className="text-gray-600 text-sm mb-1">USDT Balance</div>
          {isLoading ? (
            <div className="flex items-center gap-2">
              <Loader2 className="h-5 w-5 animate-spin text-indigo-500" />
              <span className="text-gray-800">Loading...</span>
            </div>
          ) : error ? (
            <div className="text-red-500">{error}</div>
          ) : balance !== null ? (
            <div className="text-2xl font-bold text-gray-800">
              {balance} <span className="text-sm text-gray-500">USDT</span>
            </div>
          ) : (
            <div className="text-gray-500">Not available</div>
          )}
        </div>
      </div>

      <div className="w-full">
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
        <div className="flex flex-col items-center gap-6">
          {attendedEvents.map((event) => (
            <div key={event.id.toString()} className="relative">
              <EventCard event={event} />
              <Badge className="absolute -top-3 -right-3 flex items-center gap-1">
                <TicketIcon className="h-4 w-4" />
                {event.ticketsOwned.toString()}
              </Badge>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
