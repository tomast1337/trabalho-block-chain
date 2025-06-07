import { Button } from "@/components/ui/button";

export function Home() {
  return (
    <div className="flex-grow flex flex-col items-center justify-center">
      <h1 className="text-4xl font-bold mb-4 text-gray-800">🏠 Home Page</h1>
      <Button>Click Me</Button>
    </div>
  );
}
