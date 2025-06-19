import { Routes, Route } from "react-router-dom";
import { About } from "../pages/About";
import { Home } from "../pages/Home";
import { NotFound } from "../pages/NotFound";
import { LoadingPage } from "@/pages/Loading";
import { ContractError } from "@/pages/ContractError";
import { Tickets } from "@/pages/Tickets";
import { Profile } from "@/pages/Profile";

type MainContentProps = {
  loading: boolean;
  error: boolean;
};

export function MainContent({ loading, error }: MainContentProps) {
  if (loading) return <LoadingPage />;
  if (error) return <ContractError />;

  return (
    <main className="flex-grow">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/tickets" element={<Tickets />} />
        <Route path="/Profile" element={<Profile />} />
        {/* Add more routes as needed */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </main>
  );
}
