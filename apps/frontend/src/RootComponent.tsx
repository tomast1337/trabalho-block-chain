import {
  EventTicketingProvider,
  useEventTicketing,
} from "@event_ticketing/blockchain-access";
import { HashRouter } from "react-router-dom";
import { App } from "./App.tsx";
import { ThemeProvider } from "./components/theme-provider.tsx";
import { Toaster } from "./components/ui/sonner.tsx";
import { ContractError } from "./pages/ContractError.tsx";
import { EthereumProviderErrorPage } from "./pages/EthereumProviderErrorPage.tsx";
import { WalletInitializingPage } from "./pages/WalletInitializingPage.tsx";

const AppContent: React.FC = () => {
  const { loading, error } = useEventTicketing();

  if (loading) {
    return <WalletInitializingPage />;
  }

  if (error) {
    if (error.message.includes("provider not found")) {
      return <EthereumProviderErrorPage />;
    }
    return <ContractError />;
  }

  return <App />;
};

export const RootComponent: React.FC = () => {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <EventTicketingProvider>
        <HashRouter>
          <Toaster />
          <AppContent />
        </HashRouter>
      </EventTicketingProvider>
    </ThemeProvider>
  );
};

export default RootComponent;
