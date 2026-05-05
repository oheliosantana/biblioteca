"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
import { createLoan } from "@/lib/actions/loans"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface LoanDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  bookId: string
}

export function LoanDialog({ open, onOpenChange, bookId }: LoanDialogProps) {
  const router = useRouter()
  const today = new Date().toISOString().split("T")[0]
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const fd = new FormData(e.currentTarget)
    const result = await createLoan(bookId, {
      borrowerName: fd.get("borrowerName") as string,
      loanedAt: fd.get("loanedAt") as string,
      dueDate: (fd.get("dueDate") as string) || undefined,
      notes: (fd.get("notes") as string) || undefined,
    })

    setLoading(false)
    if (!result.success) {
      setError(result.error ?? "Erro desconhecido")
      return
    }

    onOpenChange(false)
    router.refresh()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Registrar empréstimo</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="borrowerName">Quem está levando *</Label>
            <Input id="borrowerName" name="borrowerName" placeholder="Nome da pessoa" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="loanedAt">Data do empréstimo *</Label>
            <Input id="loanedAt" name="loanedAt" type="date" defaultValue={today} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="dueDate">Prazo de devolução</Label>
            <Input id="dueDate" name="dueDate" type="date" min={today} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Notas</Label>
            <Textarea id="notes" name="notes" rows={2} placeholder="Observações..." />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Registrar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
