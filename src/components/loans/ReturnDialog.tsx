"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
import { returnLoan } from "@/lib/actions/loans"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"

interface ReturnDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  loanId: string
  borrowerName: string
}

export function ReturnDialog({ open, onOpenChange, loanId, borrowerName }: ReturnDialogProps) {
  const router = useRouter()
  const today = new Date().toISOString().split("T")[0]
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleConfirm() {
    setLoading(true)
    setError(null)
    const result = await returnLoan(loanId)
    setLoading(false)
    if (!result.success) {
      setError(result.error ?? "Erro ao registrar devolução")
      return
    }
    onOpenChange(false)
    router.refresh()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Registrar devolução</DialogTitle>
          <DialogDescription>
            Confirmar devolução do livro por <strong>{borrowerName}</strong>?
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="returnDate">Data de devolução</Label>
          <Input id="returnDate" type="date" defaultValue={today} readOnly />
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={handleConfirm} disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Confirmar devolução
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
