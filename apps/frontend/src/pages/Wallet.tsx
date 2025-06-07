import { Button } from "@/components/ui/button";
import { useContracts } from "@event_ticketing/blockchain-access";
import { useEffect, useState } from "react";
import { formatUnits } from "ethers";
import { Loader2, WalletIcon } from "lucide-react";

export const Wallet = () => {
  const { usdt, eventTicketing, signer } = useContracts();
  const [balance, setBalance] = useState<string | null>(null);
  const [address, setAddress] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [pageData, setPageData] = useState<{
    data: unknown[];
    currentPage: number;
    limit: number;
  }>({
    data: [],
    currentPage: 1,
    limit: 50,
  });
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
      <div className="w-full max-w-md bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <WalletIcon className="h-6 w-6 text-indigo-500" />
            Your Wallet
          </h1>
          {address && (
            <span className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-600">
              {`${address.slice(0, 6)}...${address.slice(-4)}`}
            </span>
          )}
        </div>

        {/* Balance Card */}
        <div className="bg-indigo-50 rounded-lg p-4 mb-6">
          <div className="text-gray-600 text-sm mb-1">USDT Balance</div>
          {isLoading ? (
            <div className="flex items-center gap-2">
              <Loader2 className="h-5 w-5 animate-spin text-indigo-500" />
              <span className="text-gray-800">Loading...</span>
            </div>
          ) : error ? (
            <div className="text-red-500">{error}</div>
          ) : balance !== null ? (
            <div className="text-2xl font-bold text-gray-800">
              {balance} <span className="text-sm text-gray-500">USDT</span>
            </div>
          ) : (
            <div className="text-gray-500">Not available</div>
          )}
        </div>

        {/* Events Section */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-3">
            Your Events
          </h2>
          <Button onClick={fetchEvents} disabled={isLoading} className="w-full">
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : null}
            Fetch Your Events
          </Button>
        </div>
      </div>
    </div>
  );
};
