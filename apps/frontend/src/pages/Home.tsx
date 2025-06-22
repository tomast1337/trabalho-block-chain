import { CreateEventButton } from "@/CreateEvent/CreateEvent";
import { CalendarArrowUp } from "lucide-react";
import React from "react";
import { EventList } from "../components/EventList";

export const Home: React.FC = () => {
  return (
    <div className="flex-grow flex flex-col items-center justify-center">
      <CreateEventButton />
      <h1 className="text-4xl font-bold mt-2 mb-4 text-primary text-shadow-2xs">
        Up Coming Events{" "}
        <CalendarArrowUp className="inline-block ml-2 text-shadow-accent-foreground w-8 h-8" />
      </h1>
      <EventList />
    </div>
  );
};
