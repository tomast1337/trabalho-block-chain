import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { App } from "./App.tsx";
import {
  ContractProvider,
  initWeb3Provider,
} from "@event_ticketing/blockchain-access";
import { HashRouter } from "react-router-dom";

initWeb3Provider()
  .then(() => {
    createRoot(document.getElementById("root")!).render(
      <StrictMode>
        <ContractProvider>
          <HashRouter>
            <App />
          </HashRouter>
        </ContractProvider>
      </StrictMode>
    );
  })
  .catch((error) => {
    console.error("Failed to initialize web3 provider:", error);
    // Optionally, you can render an error message or fallback UI here
    createRoot(document.getElementById("root")!).render(
      <div className="flex flex-col items-center justify-center min-h-screen">
        <h1>Error initializing web3 provider</h1>
        <p>{error.message}</p>
      </div>
    );
  });
