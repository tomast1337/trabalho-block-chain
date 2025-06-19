import { useContracts } from "@event_ticketing/blockchain-access";
import { formatUnits } from "ethers";
import { Loader2, WalletIcon } from "lucide-react";
import { useEffect, useState } from "react";

export const Profile: React.FC = () => {
  const { usdt, eventTicketing, signer } = useContracts();
  const [balance, setBalance] = useState<string | null>(null);
  const [address, setAddress] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /*
  const [pageData, setPageData] = useState<{
    data: unknown[];
    currentPage: number;
    limit: number;
  }>({
    data: [],
    currentPage: 1,
    limit: 50,
  });
  */
  // Fetch balance automatically when component mounts
  useEffect(() => {
    const fetchBalance = async () => {
      if (signer && usdt) {
        try {
          setIsLoading(true);
          const userAddress = await signer.getAddress();
          const balance = await usdt.balanceOf(userAddress);
          setAddress(userAddress);
          setBalance(formatUnits(balance, 6)); // Assuming USDT uses 6 decimals
        } catch (err) {
          console.error("Error fetching balance:", err);
          setError("Failed to fetch balance");
        } finally {
          setIsLoading(false);
        }
      }
    };

    fetchBalance();
  }, [signer, usdt]);

  const fetchEvents = async () => {
    if (!eventTicketing) return;

    try {
      setIsLoading(true);
      const eventCount = await eventTicketing.eventCount();
      console.log("Total events:", eventCount.toString());

      const events = [];
      for (let i = 0; i < eventCount; i++) {
        const event = await eventTicketing.events(i);
        events.push(event);
        console.log(`Event ${i}:`, event);
      }

      return events;
    } catch (err) {
      console.error("Error fetching events:", err);
      setError("Failed to fetch events");
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-grow flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-primary-foreground rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-accent-foreground flex items-center gap-2">
            <WalletIcon className="h-6 w-6 text-accent-foreground" />
            Your Wallet
          </h1>
          {address && (
            <span className="text-xs text-primary bg-accent rounded-full px-3 py-1">
              {`${address.slice(0, 6)}...${address.slice(-4)}`}
            </span>
          )}
        </div>

        {/* Balance Card */}
        <div className="bg-card p-4 rounded-lg shadow-md">
          <div className="text-primary text-sm mb-1">USDT Balance</div>
          {isLoading ? (
            <div className="flex items-center gap-2">
              <Loader2 className="h-5 w-5 animate-spin text-accent-foreground" />
              <span className="text-card-foreground">Loading...</span>
            </div>
          ) : error ? (
            <div className="text-red-500">{error}</div>
          ) : balance !== null ? (
            <div className="text-2xl font-bold text-accent-foreground">
              {balance} <span className="text-sm text-primary">USDT</span>
            </div>
          ) : (
            <div className="text-primary">No balance available</div>
          )}
        </div>
      </div>
    </div>
  );
};
