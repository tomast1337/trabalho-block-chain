import { Button } from "@/components/ui/button";

export function About() {
  return (
    <div className="flex-grow flex flex-col items-center justify-center ">
      <h1 className="text-4xl font-bold mb-4 text-gray-800">ℹ️ About Page</h1>
      <Button variant="outline">Learn More</Button>
    </div>
  );
}
