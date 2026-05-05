import { redirect } from "next/navigation"
import { format, parseISO, isAfter, isBefore, addDays } from "date-fns"
import { ptBR } from "date-fns/locale"
import { BookOpen, AlertTriangle, Clock } from "lucide-react"
import { createClient } from "@/lib/supabase/server"
import { getMyActiveLoans } from "@/lib/actions/loans"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"

export default async function MyLoansPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const loans = await getMyActiveLoans()

  const today = new Date()
  const soonThreshold = addDays(today, 7)

  function getDueBadge(dueDate: string | null) {
    if (!dueDate) return null
    const due = parseISO(dueDate)
    if (isBefore(due, today)) {
      return { label: "Atrasado", className: "text-red-600 bg-red-50 border-red-200", icon: AlertTriangle }
    }
    if (isBefore(due, soonThreshold)) {
      return { label: "Vence em breve", className: "text-amber-600 bg-amber-50 border-amber-200", icon: Clock }
    }
    return null
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Meus empréstimos ativos</h1>

      {loans.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed bg-muted/30 py-16 text-center">
          <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium">Nenhum empréstimo ativo</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Você não tem livros emprestados no momento.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {loans.map((loan) => {
            const badge = getDueBadge(loan.due_date)
            const BadgeIcon = badge?.icon
            return (
              <Card key={loan.id}>
                <CardContent className="flex gap-4 py-4">
                  {loan.book_cover_url ? (
                    <img src={loan.book_cover_url} alt={loan.book_title} className="w-12 h-16 object-cover rounded shadow-sm shrink-0" />
                  ) : (
                    <div className="w-12 h-16 bg-muted rounded flex items-center justify-center shrink-0">
                      <BookOpen className="h-5 w-5 text-muted-foreground" />
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/libraries/${loan.library_id}/books/${loan.book_id}`}
                      className="font-semibold line-clamp-1 hover:underline"
                    >
                      {loan.book_title}
                    </Link>
                    <p className="text-sm text-muted-foreground line-clamp-1">{loan.book_authors.join(", ")}</p>
                    <p className="text-xs text-muted-foreground mt-1">{loan.library_name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Retirado em {format(parseISO(loan.loaned_at), "dd/MM/yyyy", { locale: ptBR })}
                      {loan.due_date && (
                        <> · Devolução: {format(parseISO(loan.due_date), "dd/MM/yyyy", { locale: ptBR })}</>
                      )}
                    </p>
                  </div>

                  {badge && BadgeIcon && (
                    <div className="shrink-0 self-center">
                      <Badge variant="outline" className={`flex items-center gap-1 ${badge.className}`}>
                        <BadgeIcon className="h-3 w-3" />
                        {badge.label}
                      </Badge>
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
