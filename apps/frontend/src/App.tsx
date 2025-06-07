import { useContracts } from "@event_ticketing/blockchain-access";
import { Footer } from "./components/Footer";
import { MainContent } from "./components/MainContent";
import { Header } from "./components/Header";

export function App() {
  const { error, loading, usdt } = useContracts();

  // Log balance for debugging
  const userBalance = usdt
    ? usdt.balanceOf("0x9E8d12FC1F2F698a1454D040DA1112Ad3FFB5BDe")
    : null;
  console.log("USDT Balance:", userBalance);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow">
        <MainContent loading={loading} error={!!error} />
      </main>
      <Footer />
    </div>
  );
}
