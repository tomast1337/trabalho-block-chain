import { useEventTicketing } from "@event_ticketing/blockchain-access";
import { formatUnits } from "ethers";
import { Loader2, WalletIcon } from "lucide-react";
import { useEffect, useState } from "react";
import {
  EventCard,
  type Event as EventType,
} from "../components/EventList/EventCard";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export const Profile: React.FC = () => {
  const { usdc, eventTicketing, signer } = useEventTicketing();
  const [balance, setBalance] = useState<string | null>(null);
  const [address, setAddress] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdEvents, setCreatedEvents] = useState<EventType[]>([]);
  const [eventsLoading, setEventsLoading] = useState(true);

  const fetchProfileData = async () => {
    if (signer && usdc && eventTicketing) {
      setIsLoading(true);
      setEventsLoading(true);
      try {
        const userAddress = await signer.getAddress();
        const balance = await usdc.balanceOf(userAddress);
        setAddress(userAddress);
        setBalance(formatUnits(balance, 6));

        const events = await eventTicketing.getEventsByOrganizer(userAddress);
        setCreatedEvents(events);
      } catch (err) {
        console.error("Error fetching profile data:", err);
        setError("Failed to fetch profile data");
      } finally {
        setIsLoading(false);
        setEventsLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchProfileData();
  }, [signer, usdc, eventTicketing]);

  const handleWithdraw = async (eventId: bigint) => {
    if (!eventTicketing) return;

    const promise = async () => {
      const tx = await eventTicketing.withdrawFunds(eventId);
      await tx.wait();
      // Refresh events after withdrawal
      await fetchProfileData();
    };

    toast.promise(promise(), {
      loading: "Withdrawing funds...",
      success: "Funds withdrawn successfully!",
      error: "Failed to withdraw funds.",
    });
  };

  return (
    <div className="flex-grow flex flex-col items-center p-4">
      <div className="w-full max-w-md bg-primary-foreground rounded-lg shadow-lg p-6 mb-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-accent-foreground flex items-center gap-2">
            <WalletIcon className="h-6 w-6 text-accent-foreground" />
            Your Wallet
          </h1>
          {address && (
            <span className="text-xs text-primary bg-accent rounded-full px-3 py-1">
              {`${address.slice(0, 6)}...${address.slice(-4)}`}
            </span>
          )}
        </div>

        <div className="bg-card p-4 rounded-lg shadow-md">
          <div className="text-primary text-sm mb-1">USDT Balance</div>
          {isLoading ? (
            <div className="flex items-center gap-2">
              <Loader2 className="h-5 w-5 animate-spin text-accent-foreground" />
              <span className="text-card-foreground">Loading...</span>
            </div>
          ) : error ? (
            <div className="text-red-500">{error}</div>
          ) : balance !== null ? (
            <div className="text-2xl font-bold text-accent-foreground">
              {balance} <span className="text-sm text-primary">USDT</span>
            </div>
          ) : (
            <div className="text-primary">No balance available</div>
          )}
        </div>
      </div>

      <div className="w-full">
        <h2 className="text-2xl font-bold text-center mb-6">
          Your Created Events
        </h2>
        {eventsLoading && (
          <div className="flex justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
          </div>
        )}
        {!eventsLoading && createdEvents.length === 0 && (
          <p className="text-center text-gray-500">
            You have not created any events yet.
          </p>
        )}
        <div className="flex flex-col items-center gap-6">
          {createdEvents.map((event) => (
            <div key={event.id.toString()} className="relative">
              <EventCard event={event} />
              {new Date(Number(event.eventDate) * 1000) < new Date() &&
                !event.isEventOver && (
                  <Button
                    onClick={() => handleWithdraw(event.id)}
                    className="absolute bottom-6 right-6"
                  >
                    Withdraw Funds
                  </Button>
                )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
