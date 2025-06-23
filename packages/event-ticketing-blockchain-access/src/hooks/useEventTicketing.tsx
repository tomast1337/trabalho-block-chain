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
          setError(
            e instanceof Error
              ? e
              : new Error("Failed to initialize provider and signer")
          );
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
      }}
    >
      {children}
    </EventTicketingContext.Provider>
  );
};

export const useEventTicketing = () => useContext(EventTicketingContext);
