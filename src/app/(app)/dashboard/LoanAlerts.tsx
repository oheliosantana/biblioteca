"use client"

import Link from "next/link"
import { AlertTriangle, Clock } from "lucide-react"
import { differenceInDays, parseISO } from "date-fns"
import { OverdueLoan } from "@/lib/actions/loans"

interface LoanAlertsProps {
  overdue: OverdueLoan[]
  soonDue: OverdueLoan[]
}

export function LoanAlerts({ overdue, soonDue }: LoanAlertsProps) {
  if (overdue.length === 0 && soonDue.length === 0) return null

  const today = new Date()

  return (
    <section className="space-y-3">
      <h2 className="text-xl font-semibold text-destructive flex items-center gap-2">
        <AlertTriangle className="h-5 w-5" />
        Atenção
      </h2>

      {overdue.length > 0 && (
        <div className="rounded-lg border border-red-200 bg-red-50 dark:bg-red-950/20 p-4 space-y-3">
          <p className="font-medium text-red-700 dark:text-red-300">
            {overdue.length} livro{overdue.length > 1 ? "s" : ""} com prazo vencido
          </p>
          <ul className="space-y-2">
            {overdue.map((loan) => {
              const days = Math.abs(differenceInDays(parseISO(loan.due_date), today))
              return (
                <li key={loan.id} className="flex items-center justify-between text-sm">
                  <div>
                    <Link
                      href={`/libraries/${loan.library_id}/books/${loan.book_id}`}
                      className="font-medium hover:underline"
                    >
                      {loan.book_title}
                    </Link>
                    <span className="text-muted-foreground"> · {loan.library_name}</span>
                    <span className="text-red-600 dark:text-red-400">
                      {" "}· emprestado para {loan.borrower_name} · venceu há {days} dia{days !== 1 ? "s" : ""}
                    </span>
                  </div>
                </li>
              )
            })}
          </ul>
        </div>
      )}

      {soonDue.length > 0 && (
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 dark:bg-yellow-950/20 p-4 space-y-3">
          <p className="font-medium text-yellow-700 dark:text-yellow-300 flex items-center gap-2">
            <Clock className="h-4 w-4" />
            {soonDue.length} livro{soonDue.length > 1 ? "s" : ""} vencendo esta semana
          </p>
          <ul className="space-y-2">
            {soonDue.map((loan) => {
              const days = differenceInDays(parseISO(loan.due_date), today)
              return (
                <li key={loan.id} className="text-sm">
                  <Link
                    href={`/libraries/${loan.library_id}/books/${loan.book_id}`}
                    className="font-medium hover:underline"
                  >
                    {loan.book_title}
                  </Link>
                  <span className="text-muted-foreground"> · {loan.library_name}</span>
                  <span className="text-yellow-600 dark:text-yellow-400">
                    {" "}· {loan.borrower_name} · vence em {days} dia{days !== 1 ? "s" : ""}
                  </span>
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </section>
  )
}
