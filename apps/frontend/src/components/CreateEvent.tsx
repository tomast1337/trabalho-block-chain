import { PlusIcon } from "lucide-react";
import { useState } from "react";
import { CreateEventModal } from "./CreateEventModal";
import { Button } from "./ui/button";

export const CreateEventButton: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  const handleClick = () => {
    setIsOpen(true);
  };

  return (
    <>
      <CreateEventModal isOpen={isOpen} onOpenChange={setIsOpen} />
      <Button
        type="button"
        className="fixed bottom-32 right-16 z-10 rounded-full shadow-lg w-14 h-14 flex items-center justify-center transition-colors duration-200 bg-accent-foreground text-accent hover:bg-accent-foreground/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent"
        aria-label="Create Event"
        style={{ position: "fixed" }}
        onClick={handleClick}
      >
        <PlusIcon className="w-7 h-7" />
      </Button>
    </>
  );
};
