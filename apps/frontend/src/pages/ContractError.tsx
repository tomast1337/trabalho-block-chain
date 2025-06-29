import { Button } from "@/components/ui/button";

export const ContractError: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-red-50 text-center px-4">
      <h1 className="text-4xl font-bold text-red-700 mb-4">
        ⚠️ Contract Error
      </h1>
      <p className="text-lg text-red-600 mb-6">
        There was an issue interacting with the smart contract. Please try again
        later or contact support.
      </p>
      <div className="flex gap-3">
        <Button onClick={() => window.location.reload()}>Try Again</Button>
      </div>
    </div>
  );
};
