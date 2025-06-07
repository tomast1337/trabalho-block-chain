// contexts/ContractContext.tsx
import React, { createContext, useContext, useEffect, useState } from "react";
import { EventTicketing } from "@event_ticketing/abi-types";
import {
  getEventTicketingContract,
  getUsdtContract,
} from "../contracts/eventTicketing";

interface ContractContextType {
  eventTicketing: EventTicketing | null;
  usdt: ERC20 | null;
  loading: boolean;
  error: Error | null;
}
const ContractContext = createContext<ContractContextType>({
  eventTicketing: null,
  usdt: null,
  loading: true,
  error: null,
});

export const ContractProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [contracts, setContracts] = useState<{
    eventTicketing: EventTicketing | null;
    usdt: ERC20 | null;
  }>({
    eventTicketing: null,
    usdt: null,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function loadContracts() {
      try {
        const [eventTicketing, usdt] = await Promise.all([
          getEventTicketingContract(),
          getUsdtContract(),
        ]);

        setContracts({
          eventTicketing,
          usdt,
        });
      } catch (err) {
        setError(
          err instanceof Error ? err : new Error("Failed to load contracts")
        );
      } finally {
        setLoading(false);
      }
    }

    loadContracts();
  }, []);

  return (
    <ContractContext.Provider value={{ ...contracts, loading, error }}>
      {children}
    </ContractContext.Provider>
  );
};

export const useContracts = () => useContext(ContractContext);
