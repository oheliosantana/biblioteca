"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { formatDistanceToNow, parseISO } from "date-fns"
import { ptBR } from "date-fns/locale"
import { BookOpen, CheckCircle2, XCircle, Ban, Clock, Loader2 } from "lucide-react"
import { cancelRequest } from "@/lib/actions/loanRequests"
import { LoanRequestWithDetails } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { toast } from "sonner"

const STATUS_CONFIG = {
  pendente: { label: "Pendente", icon: Clock, className: "text-amber-600 bg-amber-50 border-amber-200" },
  aprovada: { label: "Aprovada", icon: CheckCircle2, className: "text-green-600 bg-green-50 border-green-200" },
  rejeitada: { label: "Rejeitada", icon: XCircle, className: "text-red-600 bg-red-50 border-red-200" },
  cancelada: { label: "Cancelada", icon: Ban, className: "text-muted-foreground bg-muted/50 border-border" },
}

interface MyRequestsListProps {
  requests: LoanRequestWithDetails[]
}

export function MyRequestsList({ requests }: MyRequestsListProps) {
  const router = useRouter()
  const [canceling, setCanceling] = useState<string | null>(null)

  async function handleCancel(requestId: string) {
    setCanceling(requestId)
    const result = await cancelRequest(requestId)
    setCanceling(null)
    if (!result.success) {
      toast.error(result.error ?? "Erro ao cancelar")
      return
    }
    toast.success("Solicitação cancelada.")
    router.refresh()
  }

  if (requests.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed bg-muted/30 py-16 text-center">
        <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium">Nenhuma solicitação ainda</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Visite uma biblioteca e solicite o empréstimo de um livro.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {requests.map((req) => {
        const config = STATUS_CONFIG[req.status as keyof typeof STATUS_CONFIG]
        const Icon = config?.icon ?? Clock
        return (
          <Card key={req.id}>
            <CardContent className="flex gap-4 py-4">
              {req.book_cover_url ? (
                <img src={req.book_cover_url} alt={req.book_title} className="w-12 h-16 object-cover rounded shadow-sm shrink-0" />
              ) : (
                <div className="w-12 h-16 bg-muted rounded flex items-center justify-center shrink-0">
                  <BookOpen className="h-5 w-5 text-muted-foreground" />
                </div>
              )}

              <div className="flex-1 min-w-0">
                <p className="font-semibold line-clamp-1">{req.book_title}</p>
                <p className="text-sm text-muted-foreground line-clamp-1">{req.book_authors.join(", ")}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {req.library_name} · {formatDistanceToNow(parseISO(req.created_at), { addSuffix: true, locale: ptBR })}
                </p>
                {req.manager_response && (
                  <p className="text-sm text-muted-foreground italic mt-1 line-clamp-2">
                    Resposta: "{req.manager_response}"
                  </p>
                )}
              </div>

              <div className="flex flex-col items-end gap-2 shrink-0">
                {config && (
                  <Badge variant="outline" className={`flex items-center gap-1 ${config.className}`}>
                    <Icon className="h-3 w-3" />
                    {config.label}
                  </Badge>
                )}
                {req.status === "pendente" && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-xs text-muted-foreground hover:text-destructive h-7 px-2"
                    disabled={canceling === req.id}
                    onClick={() => handleCancel(req.id)}
                  >
                    {canceling === req.id ? <Loader2 className="h-3 w-3 animate-spin" /> : "Cancelar"}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
