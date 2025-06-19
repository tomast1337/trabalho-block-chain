import { cn } from "@/lib/utils";
import { useContracts } from "@event_ticketing/blockchain-access";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@radix-ui/react-popover";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import zod from "zod";
import { Button } from "./ui/button";
import { Calendar } from "./ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "./ui/form";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";

const eventSchema = zod.object({
  name: zod.string().min(1, "Event name is required"),
  description: zod.string().min(1, "Event description is required"),
  ticketPrice: zod.number().min(0, "Ticket price must be a positive number"),
  totalTickets: zod.number().int().min(1, "Total tickets must be at least 1"),
  eventDate: zod.string().refine((date) => !isNaN(Date.parse(date)), {
    message: "Invalid date format",
  }),
});
type EventFormData = zod.infer<typeof eventSchema>;
export const CreateEventModal: React.FC<{
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}> = ({ isOpen, onOpenChange }) => {
  const { eventTicketing } = useContracts();

  const form = useForm<EventFormData>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      name: "",
      description: "",
      ticketPrice: 0,
      totalTickets: 1,
      eventDate: new Date().toISOString(),
    },
  });

  const [blockTimeStamp, setBlockTimestamp] = useState<bigint | null>(null);
  const [blockTimestampLoading, setBlockTimestampLoading] = useState(false);
  const [blockTimestampError, setBlockTimestampError] = useState<string | null>(
    null
  );

  useEffect(() => {
    const fetchBlockTimestamp = async () => {
      if (eventTicketing) {
        try {
          setBlockTimestampLoading(true);
          setBlockTimestampError(null);
          const block = await eventTicketing.getBlockTimestamp();
          setBlockTimestamp(block);
        } catch (error) {
          console.error("Error fetching block timestamp:", error);
          setBlockTimestampError("Failed to fetch blockchain time");
        } finally {
          setBlockTimestampLoading(false);
        }
      }
    };

    fetchBlockTimestamp();
  }, [eventTicketing]);

  const onSubmit = async (data: EventFormData) => {
    // Here you would typically send the data to your backend
    if (eventTicketing) {
      const now = Math.floor(Date.now() / 1000);
      const eventDateTimestamp = Math.floor(
        new Date(data.eventDate).getTime() / 1000
      );
      const bufferSeconds = 300; // 5-minute buffer for block confirmation

      if (eventDateTimestamp <= now) {
        toast.error("Event date must be at least 5 minutes in the future.");
        return;
      }

      if (
        blockTimeStamp &&
        eventDateTimestamp <= Number(blockTimeStamp) + bufferSeconds
      ) {
        toast.error(
          `Event date must be after block timestamp (${new Date(
            Number(blockTimeStamp) * 1000
          ).toLocaleString()})`
        );
        return;
      }
      try {
        await eventTicketing.createEvent(
          data.name,
          data.description,
          Math.floor(new Date(data.eventDate).getTime() / 1000),
          data.totalTickets,
          data.ticketPrice * 1e6
        );
        toast.success("Event created successfully!");
        onOpenChange(false);
      } catch (error: unknown) {
        console.error("Error creating event:", error);

        function isEthersErrorWithReason(e: unknown): e is { reason: string } {
          return (
            typeof e === "object" &&
            e !== null &&
            "reason" in e &&
            typeof (e as { reason: unknown }).reason === "string"
          );
        }

        if (isEthersErrorWithReason(error)) {
          const reason = error.reason;
          if (reason.includes("Event date must be in the future")) {
            toast.error("Please select a future date for your event");
          } else if (reason.includes("insufficient funds")) {
            toast.error("You need ETH to cover transaction costs");
          } else {
            toast.error("Failed to create event. Please try again.");
          }
        } else {
          toast.error("Failed to create event. Please try again.");
        }
      }
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create Event</DialogTitle>
          <DialogDescription>
            Fill out the form to create a new event.
          </DialogDescription>
        </DialogHeader>

        {/* Wrap the form content with Form component */}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Event Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter event name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Tell attendees about your event"
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="ticketPrice"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ticket Price (USDT)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="0.00"
                      {...field}
                      onChange={(e) =>
                        field.onChange(parseFloat(e.target.value))
                      }
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="totalTickets"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Total Tickets Available</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="100"
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="eventDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Event Date</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-[240px] pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(new Date(field.value), "PPP")
                          ) : (
                            <span>Pick a date</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={new Date(field.value)}
                        onSelect={(date) => field.onChange(date?.toISOString())}
                        disabled={(date) => {
                          if (blockTimestampLoading) return true;
                          if (blockTimestampError) return date < new Date();

                          const minDate = blockTimeStamp
                            ? new Date(Number(blockTimeStamp) * 1000 + 300000) // 5-minute buffer
                            : new Date();

                          return date < minDate;
                        }}
                        autoFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit">Create Event</Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
