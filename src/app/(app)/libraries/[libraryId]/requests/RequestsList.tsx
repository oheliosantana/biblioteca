"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { formatDistanceToNow, parseISO } from "date-fns"
import { ptBR } from "date-fns/locale"
import { BookOpen, CheckCircle, XCircle } from "lucide-react"
import { approveRequest, rejectRequest } from "@/lib/actions/loanRequests"
import { LoanRequestWithDetails } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { toast } from "sonner"

const AVATAR_COLORS = ["bg-indigo-500", "bg-emerald-500", "bg-amber-500", "bg-rose-500", "bg-violet-500"]

function RequesterAvatar({ name, index }: { name: string | null; index: number }) {
  const initials = name ? name.slice(0, 2).toUpperCase() : "??"
  return (
    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-semibold shrink-0 ${AVATAR_COLORS[index % AVATAR_COLORS.length]}`}>
      {initials}
    </div>
  )
}

interface RequestsListProps {
  requests: LoanRequestWithDetails[]
}

export function RequestsList({ requests }: RequestsListProps) {
  const router = useRouter()
  const [rejectTarget, setRejectTarget] = useState<LoanRequestWithDetails | null>(null)
  const [rejectMessage, setRejectMessage] = useState("")
  const [processing, setProcessing] = useState<string | null>(null)

  if (requests.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed bg-muted/30 py-16 text-center">
        <CheckCircle className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium">Nenhuma solicitação pendente 🎉</h3>
        <p className="text-sm text-muted-foreground mt-1">Todas as solicitações foram processadas.</p>
      </div>
    )
  }

  async function handleApprove(requestId: string) {
    setProcessing(requestId)
    const result = await approveRequest(requestId)
    setProcessing(null)
    if (!result.success) {
      toast.error(result.error ?? "Erro ao aprovar")
      return
    }
    toast.success("Solicitação aprovada! Empréstimo registrado.")
    router.refresh()
  }

  async function handleReject() {
    if (!rejectTarget) return
    setProcessing(rejectTarget.id)
    const result = await rejectRequest(rejectTarget.id, rejectMessage || undefined)
    setProcessing(null)
    if (!result.success) {
      toast.error(result.error ?? "Erro ao rejeitar")
      setRejectTarget(null)
      return
    }
    toast.success("Solicitação rejeitada.")
    setRejectTarget(null)
    setRejectMessage("")
    router.refresh()
  }

  return (
    <>
      <div className="space-y-4">
        {requests.map((req, i) => (
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

                <div className="flex items-center gap-2 mt-2">
                  <RequesterAvatar name={req.requester_display_name} index={i} />
                  <div>
                    <p className="text-sm font-medium">{req.requester_display_name ?? "Usuário"}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(parseISO(req.created_at), { addSuffix: true, locale: ptBR })}
                    </p>
                  </div>
                </div>

                {req.message && (
                  <p className="text-sm text-muted-foreground italic mt-2 line-clamp-2">
                    "{req.message}"
                  </p>
                )}
              </div>

              <div className="flex flex-col gap-2 shrink-0">
                <Button
                  size="sm"
                  className="bg-green-600 hover:bg-green-700 text-white"
                  disabled={processing === req.id}
                  onClick={() => handleApprove(req.id)}
                >
                  <CheckCircle className="mr-1 h-4 w-4" />
                  Aprovar
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="border-red-300 text-red-600 hover:bg-red-50"
                  disabled={processing === req.id}
                  onClick={() => { setRejectTarget(req); setRejectMessage("") }}
                >
                  <XCircle className="mr-1 h-4 w-4" />
                  Rejeitar
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={!!rejectTarget} onOpenChange={(o) => { if (!o) setRejectTarget(null) }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Rejeitar solicitação</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Mensagem de resposta para <strong>{rejectTarget?.requester_display_name ?? "o solicitante"}</strong> (opcional):
            </p>
            <Textarea
              value={rejectMessage}
              onChange={(e) => setRejectMessage(e.target.value)}
              placeholder="Explique o motivo da rejeição..."
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectTarget(null)}>Cancelar</Button>
            <Button
              onClick={handleReject}
              disabled={!!processing}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Rejeitar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
