import {
  ContractProvider,
  initWeb3Provider,
} from "@event_ticketing/blockchain-access";
import { useEffect, useState } from "react";
import { HashRouter } from "react-router-dom";
import { App } from "./App.tsx";
import { EthereumProviderErrorPage } from "./pages/EthereumProviderErrorPage.tsx";
import { WalletInitializingPage } from "./pages/WalletInitializingPage.tsx";
import { Toaster } from "./components/ui/sonner.tsx";
import { ThemeProvider } from "@/components/theme-provider";
export const RootComponent: React.FC = () => {
  const [initializationState, setInitializationState] = useState<
    "loading" | "success" | "error"
  >("loading");
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    initWeb3Provider()
      .then(() => {
        setInitializationState("success");
      })
      .catch((err) => {
        console.error("Failed to initialize web3 provider:", err);
        setError(err);
        setInitializationState("error");
      });
  }, []);

  if (initializationState === "loading") {
    return <WalletInitializingPage />;
  }

  if (initializationState === "error" && error) {
    return <EthereumProviderErrorPage error={error} />;
  }

  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <ContractProvider>
        <HashRouter>
          <Toaster />
          <App />
        </HashRouter>
      </ContractProvider>
    </ThemeProvider>
  );
};
