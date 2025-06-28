import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatDate, formatPrice } from "@/lib/utils";
import { useEventTicketing } from "@event_ticketing/blockchain-access";
import {
  BadgeDollarSign,
  Barcode,
  CalendarIcon,
  CircleX,
  House,
  LoaderCircle,
  Smile,
  SquareDashed,
  TicketIcon,
  Wallet,
} from "lucide-react";
import React, { useEffect, useMemo, useState } from "react";
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
  isCanceled?: boolean;
};
export const EventCard: React.FC<{
  event: Event;
  showBuyButton?: boolean;
  userAddress?: string;
  ticketsOwned?: bigint;
}> = ({ event, showBuyButton = true, userAddress, ticketsOwned }) => {
  const {
    checkAllowance,
    approve,
    buyTicket,
    signer,
    eventTicketing,
    cancelEvent,
    refundTicket,
  } = useEventTicketing();
  const [buttonState, setButtonState] = useState<
    "initial" | "needs_approval" | "approved" | "loading" | "purchased"
  >("initial");
  const [quantity] = useState(1);

  const ticketsAvailable =
    Number(event.totalTickets) - Number(event.ticketsSold);

  const totalPrice = useMemo(
    () => BigInt(event.ticketPrice) * BigInt(quantity),
    [event.ticketPrice, quantity]
  );

  const isUserEvent =
    useMemo(
      () =>
        userAddress &&
        event.organizer.toLowerCase() === userAddress.toLowerCase(),
      [userAddress, event.organizer]
    ) || false;
  const hasTickets = useMemo(
    () => ticketsOwned && BigInt(ticketsOwned) > 0n,
    [ticketsOwned]
  );

  useEffect(() => {
    const checkNeedsApproval = async () => {
      if (
        !signer ||
        !eventTicketing ||
        event.isEventOver ||
        ticketsAvailable <= 0 ||
        !showBuyButton ||
        hasTickets
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
    hasTickets,
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
      // Set to purchased state after successful purchase
      setButtonState("purchased");
    } catch (error) {
      console.error("Error buying ticket:", error);
      toast.error("Ticket purchase failed.");
      setButtonState("approved"); // Revert to approved state
    }
  };

  const handleCancelEvent = async () => {
    if (!event.id) return;
    try {
      await cancelEvent(event.id);
      toast.success("Event canceled successfully.");
    } catch {
      toast.error("Failed to cancel event.");
    }
  };

  const handleRefund = async () => {
    if (!event.id) return;
    try {
      await refundTicket(event.id);
      toast.success("Refund successful.");
    } catch {
      toast.error("Refund failed.");
    }
  };

  const renderButton = () => {
    if (event.isCanceled) {
      if (hasTickets) {
        return (
          <Button variant="destructive" size="sm" onClick={handleRefund}>
            Refund Ticket
          </Button>
        );
      }
      return (
        <Button variant="ghost" size="sm" disabled>
          Event Canceled
        </Button>
      );
    }
    if (!showBuyButton || hasTickets) {
      return null;
    }
    if (event.isEventOver || ticketsAvailable <= 0) {
      return (
        <Button variant="ghost" size="sm" disabled>
          {event.isEventOver ? "Event Ended" : "Sold Out"}
        </Button>
      );
    }
    switch (buttonState) {
      case "loading":
        return (
          <Button variant="ghost" size="sm" disabled>
            Loading <LoaderCircle className="animate-spin h-4 w-4 ml-2" />
          </Button>
        );
      case "needs_approval":
        return (
          <Button variant="default" size="sm" onClick={handleApprove}>
            Approve USDC
            <BadgeDollarSign className="ml-2 h-4 w-4 inline" />
          </Button>
        );
      case "approved":
        return (
          <Button variant="default" size="sm" onClick={handleBuy}>
            Buy Ticket <Barcode className="ml-2 h-4 w-4 inline" />
          </Button>
        );
      case "purchased":
        return (
          <Button variant="ghost" size="sm" disabled>
            Ticket Purchased <Smile className="ml-2 h-4 w-4 inline" />
          </Button>
        );
      default:
        return (
          <Button variant="ghost" size="sm" disabled>
            Checking status{" "}
            <LoaderCircle className="animate-spin h-4 w-4 ml-2" />
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
              {isUserEvent && (
                <Badge variant="info">
                  Your Event
                  <House className="ml-1 h-4 w-4 inline" />
                </Badge>
              )}
              {hasTickets === true && (
                <Badge variant="success">
                  Owned
                  <Wallet className="ml-1 h-4 w-4 inline" />
                </Badge>
              )}
              {event.isCanceled ? (
                <Badge variant="destructive">
                  Canceled
                  <CircleX className="ml-1 h-4 w-4 inline" />
                </Badge>
              ) : event.isEventOver ? (
                <Badge variant="danger">
                  Ended
                  <CircleX className="ml-1 h-4 w-4 inline" />
                </Badge>
              ) : ticketsAvailable <= 0 ? (
                <Badge variant="secondary">
                  Sold Out
                  <SquareDashed className="ml-1 h-4 w-4 inline" />
                </Badge>
              ) : (
                <Badge variant="success">
                  Active
                  <Smile className="ml-1 h-4 w-4 inline" />
                </Badge>
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
              $
              {(() => {
                try {
                  return formatPrice(totalPrice);
                } catch (error) {
                  console.error("Error formatting price:", error);
                  return "0.00";
                }
              })()}{" "}
              USDT
            </span>
            <div className="flex items-center gap-2">
              {renderButton()}
              {isUserEvent && !event.isEventOver && !event.isCanceled && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleCancelEvent}
                >
                  Cancel Event
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
