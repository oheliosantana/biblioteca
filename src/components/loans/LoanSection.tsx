"use client"

import { useState } from "react"
import { differenceInDays, format, parseISO } from "date-fns"
import { ptBR } from "date-fns/locale"
import { BookOpen, ChevronDown, ChevronUp } from "lucide-react"
import { Book, Loan } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { LoanDialog } from "./LoanDialog"
import { ReturnDialog } from "./ReturnDialog"

interface LoanSectionProps {
  book: Book
  libraryId: string
  canEdit: boolean
  activeLoan: Loan | null
  loanHistory: Loan[]
}

export function LoanSection({ book, libraryId, canEdit, activeLoan, loanHistory }: LoanSectionProps) {
  const [loanOpen, setLoanOpen] = useState(false)
  const [returnOpen, setReturnOpen] = useState(false)
  const [historyOpen, setHistoryOpen] = useState(false)

  const today = new Date()

  const canLoan =
    canEdit &&
    book.possession_status === "comigo" &&
    book.ownership_status === "possuido"

  const isLoaned = book.possession_status === "emprestado" && activeLoan

  if (!canLoan && !isLoaned && loanHistory.length === 0) return null

  return (
    <div className="space-y-4 pt-4">
      <Separator />

      {canLoan && (
        <Card>
          <CardContent className="flex items-center justify-between py-4">
            <div className="flex items-center gap-3">
              <BookOpen className="h-5 w-5 text-muted-foreground" />
              <p className="text-sm">Este livro está disponível para empréstimo.</p>
            </div>
            <Button onClick={() => setLoanOpen(true)}>Registrar empréstimo</Button>
          </CardContent>
        </Card>
      )}

      {isLoaned && activeLoan && (
        <Card className="border-orange-200 bg-orange-50 dark:bg-orange-950/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-base text-orange-800 dark:text-orange-200">
              📤 Emprestado
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-orange-700 dark:text-orange-300">
            <p>
              <strong>{activeLoan.borrower_name}</strong> desde{" "}
              {format(parseISO(activeLoan.loaned_at), "dd/MM/yyyy", { locale: ptBR })}
            </p>
            {activeLoan.due_date && (() => {
              const dueDate = parseISO(activeLoan.due_date)
              const diff = differenceInDays(dueDate, today)
              const isOverdue = diff < 0
              return (
                <p className={isOverdue ? "text-red-600 font-semibold" : ""}>
                  Prazo: {format(dueDate, "dd/MM/yyyy", { locale: ptBR })}{" "}
                  {isOverdue
                    ? `(VENCIDO há ${Math.abs(diff)} dias)`
                    : `(vence em ${diff} dias)`}
                </p>
              )
            })()}
            {canEdit && (
              <Button
                size="sm"
                variant="outline"
                className="mt-2 border-orange-300 text-orange-800 hover:bg-orange-100"
                onClick={() => setReturnOpen(true)}
              >
                Registrar devolução
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {loanHistory.length > 0 && (
        <div>
          <button
            type="button"
            className="flex items-center gap-2 text-sm font-medium hover:text-primary transition-colors"
            onClick={() => setHistoryOpen(!historyOpen)}
          >
            {historyOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            Histórico de empréstimos ({loanHistory.length})
          </button>

          {historyOpen && (
            <div className="mt-3 rounded-lg border overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left px-4 py-2 font-medium text-muted-foreground">Quem</th>
                    <th className="text-left px-4 py-2 font-medium text-muted-foreground">Data</th>
                    <th className="text-left px-4 py-2 font-medium text-muted-foreground">Prazo</th>
                    <th className="text-left px-4 py-2 font-medium text-muted-foreground">Devolvido</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {loanHistory.map((loan) => (
                    <tr key={loan.id} className="hover:bg-muted/30">
                      <td className="px-4 py-2">{loan.borrower_name}</td>
                      <td className="px-4 py-2 text-muted-foreground">
                        {format(parseISO(loan.loaned_at), "dd/MM/yyyy")}
                      </td>
                      <td className="px-4 py-2 text-muted-foreground">
                        {loan.due_date ? format(parseISO(loan.due_date), "dd/MM/yyyy") : "—"}
                      </td>
                      <td className="px-4 py-2 text-muted-foreground">
                        {loan.returned_at ? format(parseISO(loan.returned_at), "dd/MM/yyyy") : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      <LoanDialog open={loanOpen} onOpenChange={setLoanOpen} bookId={book.id} />

      {activeLoan && (
        <ReturnDialog
          open={returnOpen}
          onOpenChange={setReturnOpen}
          loanId={activeLoan.id}
          borrowerName={activeLoan.borrower_name}
        />
      )}
    </div>
  )
}
