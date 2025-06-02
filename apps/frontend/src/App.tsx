import { Link, Route, Routes } from "react-router-dom";
import { About } from "./pages/About";
import { ContractError } from "./pages/ContractError";
import { Home } from "./pages/Home";
import { NotFound } from "./pages/NotFound";
import { useEventTicketing } from "@event_ticketing/blockchain-access";
function App() {
  const { error, loading } = useEventTicketing();
  return (
    <>
      <nav className="flex gap-4 p-4 bg-gray-900 text-white">
        <Link to="/" className="hover:underline">
          Home
        </Link>
        <Link to="/about" className="hover:underline">
          About
        </Link>
      </nav>
      {loading && <></>}
      {error && <ContractError />}
      {!loading && !error && (
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      )}
    </>
  );
}

export default App;
