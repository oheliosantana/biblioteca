import Link from "next/link"
import { BookOpen, Search, Bell, BookMarked } from "lucide-react"
import { createClient } from "@/lib/supabase/server"
import { getPendingRequestsCount, getMyPendingRequestsCount } from "@/lib/actions/loanRequests"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu"
import { LogoutButton } from "@/components/shared/logout-button"
import { Toaster } from "@/components/ui/sonner"

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const displayName = user?.user_metadata?.display_name as string | undefined
  const email = user?.email ?? ""
  const initials = displayName
    ? displayName.slice(0, 2).toUpperCase()
    : email.slice(0, 2).toUpperCase()

  const [managerPending, myPending] = await Promise.all([
    user ? getPendingRequestsCount(user.id) : 0,
    user ? getMyPendingRequestsCount(user.id) : 0,
  ])

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-14 items-center justify-between px-4">
          <div className="flex items-center gap-6">
            <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
              <BookOpen className="h-5 w-5" />
              <span className="hidden sm:inline">Biblioteca Pessoal</span>
            </Link>

            <nav className="flex items-center gap-4">
              <Link
                href="/dashboard"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Início
              </Link>
              <Link
                href="/search"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
              >
                <Search className="h-3.5 w-3.5" />
                Buscar
              </Link>
              <Link
                href="/my-loans"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
              >
                <BookMarked className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Meus empréstimos</span>
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-2">
            {(managerPending > 0 || myPending > 0) && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative h-8 w-8">
                    <Bell className="h-4 w-4" />
                    <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                      {managerPending + myPending > 9 ? "9+" : managerPending + myPending}
                    </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>Notificações</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {managerPending > 0 && (
                    <DropdownMenuItem asChild>
                      <Link href="/dashboard" className="flex justify-between">
                        <span>Solicitações pendentes</span>
                        <span className="ml-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
                          {managerPending}
                        </span>
                      </Link>
                    </DropdownMenuItem>
                  )}
                  {myPending > 0 && (
                    <DropdownMenuItem asChild>
                      <Link href="/my-requests" className="flex justify-between">
                        <span>Minhas solicitações</span>
                        <span className="ml-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
                          {myPending}
                        </span>
                      </Link>
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="text-xs">{initials}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{displayName ?? "Usuário"}</p>
                    <p className="text-xs leading-none text-muted-foreground">{email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/my-requests">Minhas solicitações</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/my-loans">Meus empréstimos</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <LogoutButton />
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {children}
      </main>

      <Toaster />
    </div>
  )
}
