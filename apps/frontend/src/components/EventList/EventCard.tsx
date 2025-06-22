import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { format } from "date-fns";
import { formatUnits } from "ethers";
import { CalendarIcon, TicketIcon } from "lucide-react";
import React from "react";

export type Event = {
  id: bigint;
  organizer: string;
  name: string;
  description: string;
  ticketPrice: bigint;
  totalTickets: bigint;
  ticketsSold: bigint;
  eventDate: bigint;
  isEventOver: boolean;
};
export const EventCard: React.FC<{
  event: Event;
}> = ({ event }) => {
  const formatDate = (timestamp: bigint) => {
    return format(new Date(Number(timestamp) * 1000), "MMM dd, yyyy h:mm a");
  };

  const formatPrice = (price: bigint) => {
    return formatUnits(price, 6); // Assuming USDT uses 6 decimals
  };

  const ticketsAvailable =
    Number(event.totalTickets) - Number(event.ticketsSold);

  return (
    <Card className="hover:shadow-md transition-shadow min-w-[600px] mb-6">
      <CardContent className="p-6">
        <div className="flex flex-col gap-4">
          {/* Header with title and status badge */}
          <div className="flex justify-between items-start gap-2">
            <h3 className="text-xl font-semibold leading-tight">
              {event.name}
            </h3>
            {event.isEventOver ? (
              <Badge variant="destructive">Ended</Badge>
            ) : ticketsAvailable <= 0 ? (
              <Badge variant="secondary">Sold Out</Badge>
            ) : (
              <Badge variant="outline">Active</Badge>
            )}
          </div>

          {/* Description */}
          <p className="text-muted-foreground line-clamp-2">
            {event.description}
          </p>

          {/* Date and Tickets info */}
          <div className="flex flex-col gap-2 text-sm">
            <div className="flex items-center text-muted-foreground">
              <CalendarIcon className="h-4 w-4 mr-2" />
              {formatDate(event.eventDate)}
            </div>
            <div className="flex items-center text-muted-foreground">
              <TicketIcon className="h-4 w-4 mr-2" />
              {event.ticketsSold.toString()} / {event.totalTickets.toString()}{" "}
              tickets sold
              <span className="ml-2 text-primary">
                ({ticketsAvailable} available)
              </span>
            </div>
          </div>

          {/* Price and action */}
          <div className="flex justify-between items-center mt-2">
            <span className="text-lg font-bold">
              ${formatPrice(event.ticketPrice)} USDT
            </span>
            <Button
              size="sm"
              disabled={event.isEventOver || ticketsAvailable <= 0}
            >
              Buy Ticket
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
