import { useContracts } from "@event_ticketing/blockchain-access";
import { Ban, CalendarArrowUp, LoaderCircle } from "lucide-react";
import React, { useEffect, useState } from "react";
import { EventCard, type Event } from "./EventCard";

export const EventList: React.FC = () => {
  const { eventTicketing } = useContracts();
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

  const fetchEvents = async () => {
    if (!eventTicketing) return;
    const { page, limit } = data;
    try {
      const eventCount: bigint = await eventTicketing.eventCount();
      setData((prev) => ({
        ...prev,
        loading: true,
        error: undefined,
        totalEvents: eventCount,
      }));

      // Fetch paginated events
      const [eventIds, names, isFinished] =
        await eventTicketing.getEventsPaginated(
          page,
          limit,
          true // only active events
        );

      // Fetch details for each event
      const eventDetailsPromises = eventIds.map(async (id, index) => {
        const details = await eventTicketing.getEventDetails(id);
        return {
          id,
          organizer: details.organizer,
          name: names[index],
          description: details.description,
          ticketPrice: details.ticketPrice,
          totalTickets: details.totalTickets,
          ticketsSold: details.ticketsSold,
          eventDate: details.eventDate,
          isEventOver: isFinished[index],
        };
      });

      const fetchedEvents = await Promise.all(eventDetailsPromises);
      setData((prev) => ({
        ...prev,
        events: [...events, ...fetchedEvents],
        page,
        limit,
      }));
    } catch (err) {
      console.error("Error fetching events:", err);
      setData((prev) => ({
        ...prev,
        loading: false,
        error: "Failed to fetch events. Please try again later.",
      }));
    } finally {
      setData((prev) => ({
        ...prev,
        loading: false,
      }));
    }
  };

  useEffect(() => {
    fetchEvents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventTicketing]);

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
          {events.length === 0 && (
            <div className="text-center py-12">
              <CalendarArrowUp className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-lg font-medium">No events found</h3>
              <p className="mt-1 text-gray-500">
                There are currently no upcoming events.
              </p>
            </div>
          )}
          {events.map((event) => (
            <EventCard key={event.id.toString()} event={event} />
          ))}
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
