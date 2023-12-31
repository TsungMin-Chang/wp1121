"use client";

import { useState } from "react";

import AddEventDialog from "@/components/AddEventDialog";

import { cn } from "@/lib/utils";

export default function ProfileButton() {

  const [openEventDialog, setOpenEventDialog] = useState(false);
  
  return (
    <>
      <button
        className={cn(
          "my-2 rounded-full bg-brand px-4 py-2 text-white transition-colors hover:bg-brand/70",
          "disabled:cursor-not-allowed disabled:bg-brand/40 disabled:hover:bg-brand/40",
        )}
        onClick={() => setOpenEventDialog(true)}
      >
        <h1>Add Event</h1>
      </button>
      <AddEventDialog 
        open={openEventDialog}
        onClose={() => setOpenEventDialog(false)}
      />
    </>
  );
}
