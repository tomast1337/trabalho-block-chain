import React, { createContext, useContext, useEffect, useState } from "react";
import { EventTicketing } from "@event_ticketing/abi-types";
import {
  getEventTicketingContract,
  getUsdcContract,
} from "../contracts/eventTicketing";
import { BrowserProvider, JsonRpcSigner } from "ethers";

interface ContractContextType {
  eventTicketing: EventTicketing | null;
  usdt: ERC20 | null;
  provider: BrowserProvider | null;
  signer: JsonRpcSigner | null;
  loading: boolean;
  error: Error | null;
}

const ContractContext = createContext<ContractContextType>({
  eventTicketing: null,
  usdt: null,
  provider: null,
  signer: null,
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
  const [provider, setProvider] = useState<BrowserProvider | null>(null);
  const [signer, setSigner] = useState<JsonRpcSigner | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function initProviderAndSigner() {
      if (window.ethereum) {
        const _provider = new BrowserProvider(window.ethereum as any);
        setProvider(_provider);
        const _signer = await _provider.getSigner();
        setSigner(_signer);
      }
    }
    initProviderAndSigner();
  }, []);

  useEffect(() => {
    async function loadContracts() {
      try {
        const [eventTicketing, usdt] = await Promise.all([
          getEventTicketingContract(),
          getUsdcContract(),
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
    <ContractContext.Provider
      value={{
        ...contracts,
        provider,
        signer,
        loading,
        error,
      }}
    >
      {children}
    </ContractContext.Provider>
  );
};

export const useContracts = () => useContext(ContractContext);
