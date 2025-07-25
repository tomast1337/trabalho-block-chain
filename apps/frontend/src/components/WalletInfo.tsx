import { formatPrice } from "@/lib/utils";
import { useEventTicketing } from "@event_ticketing/blockchain-access";
import { Loader2, WalletIcon } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

// Wallet Info Component
export const WalletInfo: React.FC = () => {
  const [balance, setBalance] = useState<string | null>(null);
  const [address, setAddress] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { usdc, signer } = useEventTicketing();
  const fetchWalletData = useCallback(async () => {
    if (signer && usdc) {
      try {
        setIsLoading(true);
        const userAddress = await signer.getAddress();
        const balance = await usdc.balanceOf(userAddress);
        setAddress(userAddress);
        setBalance(formatPrice(balance));
      } catch (err) {
        console.error("Error fetching balance:", err);
        setError("Failed to fetch balance");
      } finally {
        setIsLoading(false);
      }
    }
  }, [signer, usdc]);

  useEffect(() => {
    fetchWalletData();
  }, [fetchWalletData]);

  return (
    <div className="w-full max-w-md bg-primary-foreground rounded-lg shadow-lg p-6 mb-8">
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
  );
};
