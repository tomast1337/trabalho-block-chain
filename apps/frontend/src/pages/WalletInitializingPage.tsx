// src/components/WalletInitializing.tsx
import { Loader2, Wallet } from "lucide-react";

export const WalletInitializingPage = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      <div className="w-full max-w-md bg-white rounded-xl shadow-sm p-8 text-center">
        <Wallet className="h-12 w-12 text-indigo-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          Connecting Wallet
        </h2>
        <p className="text-gray-600 mb-6">
          Please allow your wallet to access the Event Ticketing platform.
        </p>
        <div className="flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
        </div>
      </div>
    </div>
  );
};
