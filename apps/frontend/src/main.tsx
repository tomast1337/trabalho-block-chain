import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { initWeb3Provider } from "@event_ticketing/blockchain-access";

initWeb3Provider()
  .then(({ provider, signer }) => {
    // Optionally, you can set the provider and signer globally if needed
    console.log("Web3 provider initialized:", provider);
    console.log("Web3 signer initialized:", signer);
    createRoot(document.getElementById("root")!).render(
      <StrictMode>
        <App />
        test
      </StrictMode>
    );
  })
  .catch((error) => {
    console.error("Failed to initialize web3 provider:", error);
    // Optionally, you can render an error message or fallback UI here
    createRoot(document.getElementById("root")!).render(
      <StrictMode>
        <div className="flex flex-col items-center justify-center min-h-screen">
          <h1>Error initializing web3 provider</h1>
          <p>{error.message}</p>
        </div>
      </StrictMode>
    );
  });
