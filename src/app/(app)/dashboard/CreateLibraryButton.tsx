"use client"

import { useState } from "react"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { LibraryDialog } from "./LibraryDialog"

interface CreateLibraryButtonProps {
  label?: string
}

export function CreateLibraryButton({ label }: CreateLibraryButtonProps) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus className="mr-2 h-4 w-4" />
        {label ?? "Nova biblioteca"}
      </Button>
      <LibraryDialog open={open} onOpenChange={setOpen} />
    </>
  )
}
