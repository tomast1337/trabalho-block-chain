import { useEventTicketing } from "@event_ticketing/blockchain-access";
import { Footer } from "./components/Footer";
import { Header } from "./components/Header";
import { MainContent } from "./components/MainContent";

export const App: React.FC = () => {
  const { error, loading } = useEventTicketing();

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow">
        <MainContent loading={loading} error={!!error} />
      </main>
      <Footer />
    </div>
  );
};
