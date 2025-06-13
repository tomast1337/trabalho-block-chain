import { PlusIcon } from "lucide-react";
import { useState } from "react";
import { CreateEventModal } from "./CreateEventModal";
import { Button } from "./ui/button";

export const CreateEventButton = () => {
  const [isOpen, setIsOpen] = useState(false);

  const handleClick = () => {
    setIsOpen(true);
  };

  return (
    <>
      <CreateEventModal isOpen={isOpen} onOpenChange={setIsOpen} />
      <Button
        type="button"
        className="fixed bottom-32 right-16 z-50 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg w-14 h-14 flex items-center justify-center transition-colors duration-200"
        aria-label="Create Event"
        style={{ position: "fixed" }}
        onClick={handleClick}
      >
        <PlusIcon className="w-7 h-7" />
      </Button>
    </>
  );
};
