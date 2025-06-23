import { WalletInfo } from "@/components/WalletInfo";
import { Button } from "@/components/ui/button";
import { useEventTicketing } from "@event_ticketing/blockchain-access";
import { Loader2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import {
  EventCard,
  type Event as EventType,
} from "../components/EventList/EventCard";

export const Profile: React.FC = () => {
  const { usdc, eventTicketing, signer } = useEventTicketing();
  const [, setIsLoading] = useState(false);
  const [, setError] = useState<string | null>(null);
  const [createdEvents, setCreatedEvents] = useState<EventType[]>([]);
  const [eventsLoading, setEventsLoading] = useState(true);

  const fetchProfileData = useCallback(async () => {
    if (signer && usdc && eventTicketing) {
      setIsLoading(true);
      setEventsLoading(true);
      try {
        const userAddress = await signer.getAddress();
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
  }, [signer, usdc, eventTicketing]);

  useEffect(() => {
    fetchProfileData();
  }, [signer, usdc, eventTicketing, fetchProfileData]);

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
      <WalletInfo />

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
