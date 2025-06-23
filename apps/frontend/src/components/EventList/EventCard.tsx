import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatDate, formatPrice } from "@/lib/utils";
import { useEventTicketing } from "@event_ticketing/blockchain-access";
import { CalendarIcon, TicketIcon } from "lucide-react";
import React, { useEffect, useState } from "react";
import { toast } from "sonner";

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
  showBuyButton?: boolean;
  userAddress?: string;
  ticketsOwned?: bigint;
}> = ({ event, showBuyButton = true, userAddress, ticketsOwned }) => {
  const { checkAllowance, approve, buyTicket, signer, eventTicketing } =
    useEventTicketing();
  const [buttonState, setButtonState] = useState<
    "initial" | "needs_approval" | "approved" | "loading"
  >("initial");
  const [quantity] = useState(1);

  const ticketsAvailable =
    Number(event.totalTickets) - Number(event.ticketsSold);

  const totalPrice = event.ticketPrice * BigInt(quantity);

  const isUserEvent =
    userAddress && event.organizer.toLowerCase() === userAddress.toLowerCase();
  const hasTickets = ticketsOwned && ticketsOwned > 0n;

  useEffect(() => {
    const checkNeedsApproval = async () => {
      if (
        !signer ||
        !eventTicketing ||
        event.isEventOver ||
        ticketsAvailable <= 0 ||
        !showBuyButton
      ) {
        return;
      }
      setButtonState("loading");
      try {
        const hasEnoughAllowance = await checkAllowance(
          signer.address,
          await eventTicketing.getAddress(),
          totalPrice
        );
        setButtonState(hasEnoughAllowance ? "approved" : "needs_approval");
      } catch (error) {
        console.error("Error checking allowance:", error);
        toast.error("Error checking allowance.");
        setButtonState("initial");
      }
    };
    checkNeedsApproval();
  }, [
    signer,
    eventTicketing,
    totalPrice,
    checkAllowance,
    event.isEventOver,
    ticketsAvailable,
    showBuyButton,
  ]);

  const handleApprove = async () => {
    if (!eventTicketing) return;
    setButtonState("loading");
    try {
      const spender = await eventTicketing.getAddress();
      await approve(spender, totalPrice);
      setButtonState("approved");
      toast.success("Approval successful!");
    } catch (error) {
      console.error("Error approving:", error);
      toast.error("Approval failed.");
      setButtonState("needs_approval");
    }
  };

  const handleBuy = async () => {
    setButtonState("loading");
    try {
      await buyTicket(event.id, BigInt(quantity));
      toast.success(`Successfully bought ${quantity} ticket(s)!`);
      // Optionally reset state or refetch data
      setButtonState("initial"); // Or refetch allowance
    } catch (error) {
      console.error("Error buying ticket:", error);
      toast.error("Ticket purchase failed.");
      setButtonState("approved"); // Revert to approved state
    }
  };

  const renderButton = () => {
    if (!showBuyButton || hasTickets) {
      return null;
    }

    if (event.isEventOver || ticketsAvailable <= 0) {
      return (
        <Button size="sm" disabled>
          {event.isEventOver ? "Event Ended" : "Sold Out"}
        </Button>
      );
    }

    switch (buttonState) {
      case "loading":
        return (
          <Button size="sm" disabled>
            Loading...
          </Button>
        );
      case "needs_approval":
        return (
          <Button size="sm" onClick={handleApprove}>
            Approve USDT
          </Button>
        );
      case "approved":
        return (
          <Button size="sm" onClick={handleBuy}>
            Buy Ticket
          </Button>
        );
      default:
        return (
          <Button size="sm" disabled>
            Checking status...
          </Button>
        );
    }
  };

  return (
    <Card className="hover:shadow-md transition-shadow min-w-[600px] mb-6">
      <CardContent className="p-6">
        <div className="flex flex-col gap-4">
          {/* Header with title and status badge */}
          <div className="flex justify-between items-start gap-2">
            <h3 className="text-xl font-semibold leading-tight">
              {event.name}
            </h3>
            <div className="flex gap-2">
              {isUserEvent && <Badge variant="default">Your Event</Badge>}
              {hasTickets && <Badge variant="secondary">Owned</Badge>}
              {event.isEventOver ? (
                <Badge variant="destructive">Ended</Badge>
              ) : ticketsAvailable <= 0 ? (
                <Badge variant="secondary">Sold Out</Badge>
              ) : (
                <Badge variant="outline">Active</Badge>
              )}
            </div>
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
              ${formatPrice(event.ticketPrice * BigInt(quantity))} USDT
            </span>
            <div className="flex items-center gap-2">{renderButton()}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
