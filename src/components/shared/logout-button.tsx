"use client"

import { logout } from "@/lib/actions/auth"
import { DropdownMenuItem } from "@/components/ui/dropdown-menu"
import { LogOut } from "lucide-react"

export function LogoutButton() {
  return (
    <DropdownMenuItem
      onClick={() => logout()}
      className="cursor-pointer text-destructive focus:text-destructive"
    >
      <LogOut className="mr-2 h-4 w-4" />
      Sair
    </DropdownMenuItem>
  )
}
