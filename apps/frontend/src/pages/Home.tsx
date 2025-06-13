import { CreateEventButton } from "@/components/CreateEvent";
import { Button } from "@/components/ui/button";
import { useContracts } from "@event_ticketing/blockchain-access";

export const Home = () => {
  const { eventTicketing, usdt } = useContracts();
  const onClick = () => {
    if (eventTicketing) {
      eventTicketing
        .eventCount()
        .then((event) => {
          console.log("Event details:", event);
        })
        .catch((error) => {
          console.error("Error fetching event details:", error);
        });
    }
    if (usdt) {
      usdt
        .balanceOf("0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266")
        .then((balance: unknown) => {
          console.log("USDT Balance:", (balance as object).toString());
        })
        .catch((err: object) => {
          console.error("Error fetching USDT balance:", err);
        });
    }
  };
  return (
    <div className="flex-grow flex flex-col items-center justify-center">
      <CreateEventButton />
      <h1 className="text-4xl font-bold mb-4 text-gray-800">🏠 Home Page</h1>
      <Button onClick={onClick}>Click Me</Button>
    </div>
  );
};
