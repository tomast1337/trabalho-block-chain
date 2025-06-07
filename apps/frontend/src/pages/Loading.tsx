import { Loader2, Rocket } from "lucide-react";
export function LoadingPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white p-4">
      <div className="max-w-md w-full space-y-8 text-center">
        {/* Animated Logo/Icon */}
        <div className="flex justify-center">
          <Rocket className="h-16 w-16 text-indigo-400 animate-bounce" />
        </div>

        {/* Loading Text */}
        <h1 className="text-3xl font-bold tracking-tight">
          Preparing your experience
        </h1>
        <p className="text-gray-400">
          Just a moment while we get everything ready...
        </p>

        {/* Spinner */}
        <div className="pt-8">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-400 mx-auto" />
        </div>
      </div>
    </div>
  );
}
