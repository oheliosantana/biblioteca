"use client"

import { format, parseISO } from "date-fns"
import { ptBR } from "date-fns/locale"
import { BookOpen, CheckCircle2, XCircle, Ban } from "lucide-react"
import { LoanRequestWithDetails } from "@/lib/types"
import { Badge } from "@/components/ui/badge"

const STATUS_CONFIG = {
  aprovada: { label: "Aprovada", icon: CheckCircle2, className: "text-green-600 bg-green-50 border-green-200" },
  rejeitada: { label: "Rejeitada", icon: XCircle, className: "text-red-600 bg-red-50 border-red-200" },
  cancelada: { label: "Cancelada", icon: Ban, className: "text-muted-foreground bg-muted/50 border-border" },
}

interface RequestsHistoryProps {
  requests: LoanRequestWithDetails[]
}

export function RequestsHistory({ requests }: RequestsHistoryProps) {
  if (requests.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed bg-muted/30 py-16 text-center">
        <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium">Nenhum histórico ainda</h3>
        <p className="text-sm text-muted-foreground mt-1">As solicitações processadas aparecerão aqui.</p>
      </div>
    )
  }

  return (
    <div className="rounded-lg border divide-y">
      {requests.map((req) => {
        const config = STATUS_CONFIG[req.status as keyof typeof STATUS_CONFIG]
        const Icon = config?.icon ?? BookOpen
        return (
          <div key={req.id} className="flex items-center gap-4 px-4 py-3">
            {req.book_cover_url ? (
              <img src={req.book_cover_url} alt={req.book_title} className="w-8 h-11 object-cover rounded shadow-sm shrink-0" />
            ) : (
              <div className="w-8 h-11 bg-muted rounded flex items-center justify-center shrink-0">
                <BookOpen className="h-4 w-4 text-muted-foreground" />
              </div>
            )}

            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium line-clamp-1">{req.book_title}</p>
              <p className="text-xs text-muted-foreground">
                {req.requester_display_name ?? "Usuário"} · {format(parseISO(req.created_at), "dd/MM/yyyy", { locale: ptBR })}
              </p>
              {req.manager_response && (
                <p className="text-xs text-muted-foreground italic mt-0.5 line-clamp-1">
                  Resposta: "{req.manager_response}"
                </p>
              )}
            </div>

            {config && (
              <Badge variant="outline" className={`shrink-0 flex items-center gap-1 ${config.className}`}>
                <Icon className="h-3 w-3" />
                {config.label}
              </Badge>
            )}
          </div>
        )
      })}
    </div>
  )
}
