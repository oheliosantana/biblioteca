"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2, Send } from "lucide-react"
import { createLoanRequest, cancelRequest } from "@/lib/actions/loanRequests"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { toast } from "sonner"

interface LoanRequestButtonProps {
  bookId: string
  hasPendingRequest: boolean
  pendingRequestId?: string
}

export function LoanRequestButton({ bookId, hasPendingRequest, pendingRequestId }: LoanRequestButtonProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [message, setMessage] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleSubmit() {
    setLoading(true)
    const result = await createLoanRequest(bookId, message || undefined)
    setLoading(false)
    if (!result.success) {
      toast.error(result.error ?? "Erro ao enviar solicitação")
      return
    }
    toast.success("Solicitação enviada!")
    setOpen(false)
    setMessage("")
    router.refresh()
  }

  async function handleCancel() {
    if (!pendingRequestId) return
    setLoading(true)
    const result = await cancelRequest(pendingRequestId)
    setLoading(false)
    if (!result.success) {
      toast.error(result.error ?? "Erro ao cancelar solicitação")
      return
    }
    toast.success("Solicitação cancelada.")
    router.refresh()
  }

  if (hasPendingRequest) {
    return (
      <div className="flex flex-col gap-2">
        <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">
          Você já tem uma solicitação pendente para este livro.
        </div>
        {pendingRequestId && (
          <Button
            variant="outline"
            size="sm"
            disabled={loading}
            onClick={handleCancel}
            className="border-red-300 text-red-600 hover:bg-red-50"
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Cancelar solicitação
          </Button>
        )}
      </div>
    )
  }

  return (
    <>
      <Button className="w-full" onClick={() => setOpen(true)}>
        <Send className="mr-2 h-4 w-4" />
        Solicitar empréstimo
      </Button>

      <Dialog open={open} onOpenChange={(o) => { if (!o) setOpen(false) }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Solicitar empréstimo</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Adicione uma mensagem opcional para o responsável pela biblioteca:
            </p>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Motivo do empréstimo, prazo desejado..."
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={handleSubmit} disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Enviar solicitação
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
