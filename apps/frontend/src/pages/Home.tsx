import { Button } from "@/components/ui/button";

export function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100">
      <h1 className="text-4xl font-bold mb-4 text-gray-800">🏠 Home Page</h1>
      <Button>Click Me</Button>
    </div>
  );
}
