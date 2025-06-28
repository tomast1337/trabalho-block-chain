import { useEventTicketing } from "@event_ticketing/blockchain-access";
import { Ban, CalendarArrowUp, LoaderCircle } from "lucide-react";
import React, { useEffect, useState, useCallback, useRef } from "react";
import { EventCard, type Event } from "./EventCard";
import { Button } from "../ui/button";

export const AllEventList: React.FC = () => {
  const { eventTicketing, signer } = useEventTicketing();
  const [data, setData] = useState<{
    events: Event[];
    page: number;
    limit: number;
    totalEvents: bigint;
    error?: string;
    loading: boolean;
    hasMore: boolean;
  }>({
    events: [],
    page: 0,
    limit: 10,
    totalEvents: 0n,
    loading: true,
    hasMore: true,
  });
  const [userAddress, setUserAddress] = useState<string | undefined>();
  const [ticketsOwned, setTicketsOwned] = useState<Map<string, bigint>>(
    new Map()
  );
  const [loadingMore, setLoadingMore] = useState(false);
  const isInitialized = useRef(false);

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

  const fetchEvents = useCallback(
    async (page: number, append: boolean = false) => {
      if (!eventTicketing) return;

      if (append) {
        setLoadingMore(true);
      } else {
        setData((prev) => ({ ...prev, loading: true, error: undefined }));
      }

      try {
        const [eventInfos, total] = await eventTicketing.getEventsPaginated(
          page,
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

        // Check tickets owned for each event
        if (userAddress) {
          // Get current tickets owned for existing events
          setTicketsOwned((prev) => {
            const newMap = new Map(prev);
            return newMap;
          });

          for (const event of fetchedEvents) {
            try {
              const tickets = await eventTicketing.getTicketsOwned(
                event.id,
                userAddress
              );
              setTicketsOwned((prev) => {
                const newMap = new Map(prev);
                newMap.set(event.id.toString(), tickets);
                return newMap;
              });
            } catch (error) {
              console.error(
                `Error getting tickets owned for event ${event.id}:`,
                error
              );
              setTicketsOwned((prev) => {
                const newMap = new Map(prev);
                newMap.set(event.id.toString(), 0n);
                return newMap;
              });
            }
          }
        }

        const hasMore = (page + 1) * data.limit < Number(total);

        setData((prev) => ({
          ...prev,
          events: append ? [...prev.events, ...fetchedEvents] : fetchedEvents,
          totalEvents: total,
          loading: false,
          hasMore,
        }));
      } catch (err) {
        console.error("Error fetching events:", err);
        setData((prev) => ({
          ...prev,
          loading: false,
          error: "Failed to fetch events. Please try again later.",
        }));
      } finally {
        setLoadingMore(false);
      }
    },
    [eventTicketing, data.limit, userAddress]
  );

  // Initial load - only run once when both eventTicketing and userAddress are available
  useEffect(() => {
    if (eventTicketing && userAddress !== undefined && !isInitialized.current) {
      isInitialized.current = true;
      fetchEvents(0, false);
    }
  }, [eventTicketing, userAddress, fetchEvents]);

  const handleLoadMore = () => {
    if (!loadingMore && data.hasMore) {
      const nextPage = data.page + 1;
      setData((prev) => ({ ...prev, page: nextPage }));
      fetchEvents(nextPage, true);
    }
  };

  const { events, error, loading, hasMore } = data;

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
                ticketsOwned={ticketsOwned.get(event.id.toString())}
              />
            ))}
          </div>

          {/* Load More Button */}
          {hasMore && (
            <div className="flex items-center justify-center py-8">
              <Button
                onClick={handleLoadMore}
                disabled={loadingMore}
                variant="outline"
                className="flex items-center gap-2"
              >
                {loadingMore ? (
                  <>
                    <LoaderCircle className="h-4 w-4 animate-spin" />
                    Loading...
                  </>
                ) : (
                  "Load More Events"
                )}
              </Button>
            </div>
          )}

          {/* End of events indicator */}
          {!hasMore && events.length > 0 && (
            <div className="text-center py-8 text-gray-500">
              <p>You've reached the end of all events</p>
            </div>
          )}
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
