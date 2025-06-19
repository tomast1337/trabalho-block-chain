import { Footer } from "@/components/Footer";
import { AlertCircle, Home } from "lucide-react";

export const EthereumProviderErrorPage: React.FC<{
  error?: Error & { code?: number };
}> = ({ error }) => {
  const Message = () => {
    if (!error) {
      return (
        <div className="text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
          <h3 className="text-lg font-medium text-gray-900">
            Unexpected Error
          </h3>
          <p className="mt-2 text-gray-600">
            An unknown error occurred. Please try again later.
          </p>
        </div>
      );
    }

    // Handle user rejected action (MetaMask, WalletConnect, etc)
    if (
      (typeof error.code === "number" && error.code === 4001) ||
      (typeof error.message === "string" &&
        (error.message.toLowerCase().includes("user rejected") ||
          error.message.toLowerCase().includes("action_rejected")))
    ) {
      return (
        <div className="text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-yellow-500 mb-4" />
          <h3 className="text-lg font-medium text-gray-900">Action Rejected</h3>
          <p className="mt-2 text-gray-600">
            You rejected the wallet request. Please approve the request in your
            wallet to continue.
          </p>
        </div>
      );
    }

    if (typeof error.message === "string") {
      console.log("Ethereum Provider Error:", error);
      return (
        <div className="text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
          <h3 className="text-lg font-medium text-gray-900">Error Occurred</h3>
          <p className="mt-2 text-gray-600">{error.message}</p>
        </div>
      );
    }

    // For JSON errors
    return (
      <div className="text-center">
        <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
        <h3 className="text-lg font-medium text-gray-900">Detailed Error</h3>
        <div className="mt-4 bg-gray-50 p-4 rounded-md text-left overflow-x-auto">
          <pre className="text-sm text-gray-800 font-mono">
            {JSON.stringify(error, null, 2)}
          </pre>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <header className="sticky top-0 z-50 bg-gray-900 shadow-md">
        <div className="container mx-auto px-4 py-3">
          <div className="flex justify-between items-center">
            <a
              href="/"
              className="text-xl font-bold text-white flex items-center gap-2"
            >
              <Home className="h-5 w-5" />
              EventTicketing
            </a>
          </div>
        </div>
      </header>

      <main className="flex-grow flex items-center justify-center p-6">
        <div className="w-full max-w-2xl bg-white rounded-xl shadow-sm p-8">
          <Message />
        </div>
      </main>
      <Footer />
    </div>
  );
};
