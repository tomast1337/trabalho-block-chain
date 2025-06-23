import { useEventTicketing } from "@event_ticketing/blockchain-access";
import { Ban, CalendarArrowUp, LoaderCircle } from "lucide-react";
import React, { useEffect, useState } from "react";
import { EventCard, type Event } from "./EventCard";

export const AllEventList: React.FC = () => {
  const { eventTicketing, signer } = useEventTicketing();
  const [data, setData] = useState<{
    events: Event[];
    page: number;
    limit: number;
    totalEvents: bigint;
    error?: string;
    loading: boolean;
  }>({
    events: [],
    page: 0,
    limit: 50,
    totalEvents: 0n,
    loading: true,
  });
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
    const fetchEvents = async () => {
      if (!eventTicketing) return;

      setData((prev) => ({ ...prev, loading: true, error: undefined }));

      try {
        const [eventInfos, total] = await eventTicketing.getEventsPaginated(
          data.page,
          data.limit,
          true // Only active events
        );

        const fetchedEvents: Event[] = eventInfos.map((info) => ({
          id: info.id,
          organizer: info.organizer,
          name: info.name,
          description: info.description,
          ticketPrice: info.ticketPrice,
          totalTickets: info.totalTickets,
          ticketsSold: info.ticketsSold,
          eventDate: info.eventDate,
          isEventOver: info.isEventOver,
        }));

        setData((prev) => ({
          ...prev,
          events: [...prev.events, ...fetchedEvents],
          totalEvents: total,
          loading: false,
        }));
      } catch (err) {
        console.error("Error fetching events:", err);
        setData((prev) => ({
          ...prev,
          loading: false,
          error: "Failed to fetch events. Please try again later.",
        }));
      }
    };

    fetchEvents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventTicketing, data.page]);

  const { events, error, loading } = data;
  return (
    <section>
      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6 flex items-center">
          <Ban className="mr-2" />
          <span>{error}</span>
        </div>
      )}
      {!loading && (
        <>
          {events.length === 0 && (
            <div className="text-center py-12">
              <CalendarArrowUp className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-lg font-medium">No events found</h3>
              <p className="mt-1 text-gray-500">
                There are currently no upcoming events.
              </p>
            </div>
          )}
          <div className="max-w-[900px] mx-auto">
            {events.map((event) => (
              <EventCard
                key={event.id.toString()}
                event={event}
                userAddress={userAddress}
              />
            ))}
          </div>
        </>
      )}
      {loading && (
        <div className="flex items-center justify-center h-full">
          <LoaderCircle className="h-8 w-8 text-primary animate-spin" />
        </div>
      )}
    </section>
  );
};
