import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { EventTicketing } from "../../packages/abi-types/src";
import { Button } from "./components/ui/button";
import { Input } from "./components/ui/input";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "./components/ui/card";

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ethereum?: any;
  }
}

export default function App() {
  const [contract, setContract] = useState<EventTicketing | null>(null);
  const [account, setAccount] = useState<string | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [events, setEvents] = useState<any[]>([]);
  const [newEvent, setNewEvent] = useState({
    name: "",
    description: "",
    ticketPrice: "0.1",
    totalTickets: "100",
    eventDate: "",
  });

  useEffect(() => {
    init();
  }, []);

  const init = async () => {
    if (window.ethereum) {
      try {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        await window.ethereum.request({ method: "eth_requestAccounts" });
        const signer = provider.getSigner();
        const address = await signer.getAddress();
        setAccount(address);

        // Load contract
        const contractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3"; // Update with your deployed address
        const contract = new ethers.Contract(
          contractAddress,
          EventTicketing.abi,
          signer
        ) as unknown as EventTicketing;
        setContract(contract);

        // Load events
        await loadEvents(contract);
      } catch (error) {
        console.error("Error initializing:", error);
      }
    }
  };

  const loadEvents = async (contract: EventTicketing) => {
    const eventCount = await contract.eventCount();
    const loadedEvents = [];

    for (let i = 1; i <= eventCount; i++) {
      const event = await contract.getEventDetails(i);
      loadedEvents.push({
        id: i,
        ...event,
      });
    }

    setEvents(loadedEvents);
  };

  const handleCreateEvent = async () => {
    if (!contract) return;

    try {
      const tx = await contract.createEvent(
        newEvent.name,
        newEvent.description,
        ethers.utils.parseEther(newEvent.ticketPrice),
        parseInt(newEvent.totalTickets),
        Math.floor(new Date(newEvent.eventDate).getTime() / 1000)
      );
      await tx.wait();
      await loadEvents(contract);
    } catch (error) {
      console.error("Error creating event:", error);
    }
  };

  const handleBuyTicket = async (eventId: number, price: string) => {
    if (!contract) return;

    try {
      const tx = await contract.buyTicket(eventId, 1, {
        value: ethers.utils.parseEther(price),
      });
      await tx.wait();
      alert("Ticket purchased successfully!");
    } catch (error) {
      console.error("Error buying ticket:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Event Ticketing DApp</h1>

        {account ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle>Create Event</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <Input
                      placeholder="Event Name"
                      value={newEvent.name}
                      onChange={(e) =>
                        setNewEvent({ ...newEvent, name: e.target.value })
                      }
                    />
                    <Input
                      placeholder="Description"
                      value={newEvent.description}
                      onChange={(e) =>
                        setNewEvent({
                          ...newEvent,
                          description: e.target.value,
                        })
                      }
                    />
                    <Input
                      placeholder="Ticket Price (ETH)"
                      type="number"
                      value={newEvent.ticketPrice}
                      onChange={(e) =>
                        setNewEvent({
                          ...newEvent,
                          ticketPrice: e.target.value,
                        })
                      }
                    />
                    <Input
                      placeholder="Total Tickets"
                      type="number"
                      value={newEvent.totalTickets}
                      onChange={(e) =>
                        setNewEvent({
                          ...newEvent,
                          totalTickets: e.target.value,
                        })
                      }
                    />
                    <Input
                      placeholder="Event Date"
                      type="datetime-local"
                      value={newEvent.eventDate}
                      onChange={(e) =>
                        setNewEvent({ ...newEvent, eventDate: e.target.value })
                      }
                    />
                    <Button onClick={handleCreateEvent}>Create Event</Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="md:col-span-2">
              <h2 className="text-xl font-semibold mb-4">Available Events</h2>
              <div className="grid grid-cols-1 gap-4">
                {events.map((event) => (
                  <Card key={event.id}>
                    <CardHeader>
                      <CardTitle>{event.name}</CardTitle>
                      <CardDescription>{event.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p>
                        Price: {ethers.utils.formatEther(event.ticketPrice)} ETH
                      </p>
                      <p>
                        Tickets Available:{" "}
                        {event.totalTickets - event.ticketsSold}
                      </p>
                      <p>
                        Event Date:{" "}
                        {new Date(event.eventDate * 1000).toLocaleString()}
                      </p>
                      <Button
                        className="mt-4"
                        onClick={() =>
                          handleBuyTicket(event.id, event.ticketPrice)
                        }
                      >
                        Buy Ticket
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <Button onClick={init}>Connect Wallet</Button>
        )}
      </div>
    </div>
  );
}
