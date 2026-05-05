import { Plus } from "lucide-react"
import { createClient } from "@/lib/supabase/server"
import { getMyLibraries } from "@/lib/actions/libraries"
import { getOverdueAndSoonLoans } from "@/lib/actions/loans"
import { Button } from "@/components/ui/button"
import { LibraryCard } from "./LibraryCard"
import { LoanAlerts } from "./LoanAlerts"
import { CreateLibraryButton } from "./CreateLibraryButton"

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const displayName = user?.user_metadata?.display_name as string | undefined

  const [libraries, { overdue, soonDue }] = await Promise.all([
    getMyLibraries(),
    getOverdueAndSoonLoans(),
  ])

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Olá, {displayName ?? "usuário"}! 👋
          </h1>
          <p className="text-muted-foreground mt-1">Sua biblioteca pessoal</p>
        </div>
        <CreateLibraryButton />
      </div>

      <LoanAlerts overdue={overdue} soonDue={soonDue} />

      <section>
        <h2 className="text-xl font-semibold mb-4">Suas bibliotecas</h2>

        {libraries.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed bg-muted/30 py-16 text-center">
            <svg
              className="h-16 w-16 text-muted-foreground mb-4"
              fill="none"
              viewBox="0 0 64 64"
              stroke="currentColor"
              strokeWidth={1}
            >
              <rect x="4" y="16" width="12" height="40" rx="2" />
              <rect x="20" y="8" width="12" height="48" rx="2" />
              <rect x="36" y="20" width="12" height="36" rx="2" />
              <rect x="52" y="12" width="8" height="44" rx="2" />
              <line x1="2" y1="56" x2="62" y2="56" strokeWidth={2} />
            </svg>
            <h3 className="text-lg font-medium">Nenhuma biblioteca ainda</h3>
            <p className="text-muted-foreground text-sm mt-1 mb-6 max-w-xs">
              Crie sua primeira biblioteca para começar a organizar seus livros.
            </p>
            <CreateLibraryButton label="Criar primeira biblioteca" />
          </div>
        ) : (
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {libraries.map((library, i) => (
              <LibraryCard key={library.id} library={library} index={i} />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
