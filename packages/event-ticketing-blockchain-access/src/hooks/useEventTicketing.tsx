import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { EventTicketing } from "@event_ticketing/abi-types";
import {
  getEventTicketingContract,
  getUsdcContract,
  cancelEvent as cancelEventHelper,
  refundTicket as refundTicketHelper,
} from "../contracts/eventTicketing";
import { BrowserProvider, JsonRpcSigner, MaxUint256 } from "ethers";
import { MockUSDC } from "@event_ticketing/abi-types/src/contracts/MockUSDC";

interface EventTicketingContextType {
  eventTicketing: EventTicketing | null;
  usdc: MockUSDC | null;
  provider: BrowserProvider | null;
  signer: JsonRpcSigner | null;
  loading: boolean;
  error: Error | null;
  checkAllowance: (
    owner: string,
    spender: string,
    amount: bigint
  ) => Promise<boolean>;
  approve: (spender: string, amount: bigint) => Promise<void>;
  buyTicket: (eventId: bigint, quantity: bigint) => Promise<void>;
  cancelEvent: (eventId: bigint) => Promise<void>;
  refundTicket: (eventId: bigint) => Promise<void>;
}

const EventTicketingContext = createContext<EventTicketingContextType>({
  eventTicketing: null,
  usdc: null,
  provider: null,
  signer: null,
  loading: true,
  error: null,
  checkAllowance: async () => false,
  approve: async () => {},
  buyTicket: async () => {},
  cancelEvent: async () => {},
  refundTicket: async () => {},
});

export const EventTicketingProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const [contracts, setContracts] = useState<{
    eventTicketing: EventTicketing | null;
    usdc: MockUSDC | null;
  }>({
    eventTicketing: null,
    usdc: null,
  });
  const [provider, setProvider] = useState<BrowserProvider | null>(null);
  const [signer, setSigner] = useState<JsonRpcSigner | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function initProviderAndSigner() {
      if (window.ethereum) {
        try {
          const _provider = new BrowserProvider(window.ethereum as any);
          setProvider(_provider);
          const _signer = await _provider.getSigner();
          setSigner(_signer);
        } catch (e) {
          // Handle user rejection specifically
          if (e && typeof e === "object") {
            // Check for direct code property
            if ("code" in e && (e as any).code === 4001) {
              setError(
                new Error(
                  "Wallet connection was rejected. Please connect your wallet to continue."
                )
              );
              return;
            }

            // Check for nested error structure (like the one you're seeing)
            if ("info" in e && typeof (e as any).info === "object") {
              const info = (e as any).info;
              if (info.error && info.error.code === 4001) {
                setError(
                  new Error(
                    "Wallet connection was rejected. Please connect your wallet to continue."
                  )
                );
                return;
              }
            }

            // Check for ACTION_REJECTED in the error message
            if ("message" in e && typeof (e as any).message === "string") {
              const message = (e as any).message.toLowerCase();
              if (
                message.includes("action_rejected") ||
                message.includes("user rejected")
              ) {
                setError(
                  new Error(
                    "Wallet connection was rejected. Please connect your wallet to continue."
                  )
                );
                return;
              }
            }

            // Fallback to generic error handling
            setError(
              e instanceof Error
                ? e
                : new Error("Failed to initialize provider and signer")
            );
          } else {
            setError(
              e instanceof Error
                ? e
                : new Error("Failed to initialize provider and signer")
            );
          }
        }
      } else {
        setError(new Error("Ethereum provider not found"));
      }
    }
    initProviderAndSigner();
  }, []);

  useEffect(() => {
    async function loadContracts() {
      if (!signer) return;
      try {
        const [eventTicketing, usdc] = await Promise.all([
          getEventTicketingContract(signer),
          getUsdcContract(signer),
        ]);
        setContracts({
          eventTicketing,
          usdc,
        });
      } catch (err) {
        setError(
          err instanceof Error ? err : new Error("Failed to load contracts")
        );
      } finally {
        setLoading(false);
      }
    }
    if (signer) {
      loadContracts();
    }
  }, [signer]);

  const checkAllowance = useCallback(
    async (owner: string, spender: string, amount: bigint) => {
      if (!contracts.usdc) throw new Error("USDC contract not loaded");
      const allowance = await contracts.usdc.allowance(owner, spender);
      return allowance >= amount;
    },
    [contracts.usdc]
  );

  const approve = useCallback(
    async (spender: string, amount: bigint) => {
      if (!contracts.usdc) throw new Error("USDC contract not loaded");
      const tx = await contracts.usdc.approve(spender, amount);
      await tx.wait();
    },
    [contracts.usdc]
  );

  const buyTicket = useCallback(
    async (eventId: bigint, quantity: bigint) => {
      if (!contracts.eventTicketing)
        throw new Error("EventTicketing contract not loaded");
      const tx = await contracts.eventTicketing.buyTicket(eventId, quantity);
      await tx.wait();
    },
    [contracts.eventTicketing]
  );

  const cancelEvent = useCallback(
    async (eventId: bigint) => {
      if (!signer) throw new Error("Signer not loaded");
      await cancelEventHelper(signer, eventId);
    },
    [signer]
  );

  const refundTicket = useCallback(
    async (eventId: bigint) => {
      if (!signer) throw new Error("Signer not loaded");
      await refundTicketHelper(signer, eventId);
    },
    [signer]
  );

  return (
    <EventTicketingContext.Provider
      value={{
        ...contracts,
        provider,
        signer,
        loading,
        error,
        checkAllowance,
        approve,
        buyTicket,
        cancelEvent,
        refundTicket,
      }}
    >
      {children}
    </EventTicketingContext.Provider>
  );
};

export const useEventTicketing = () => useContext(EventTicketingContext);
