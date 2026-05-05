"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { X, Loader2 } from "lucide-react"
import { createCategory, deleteCategory } from "@/lib/actions/categories"
import { Category } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface CategoriesManagerProps {
  libraryId: string
  initialCategories: Category[]
}

export function CategoriesManager({ libraryId, initialCategories }: CategoriesManagerProps) {
  const router = useRouter()
  const [categories, setCategories] = useState(initialCategories)
  const [newName, setNewName] = useState("")
  const [adding, setAdding] = useState(false)
  const [addError, setAddError] = useState<string | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!newName.trim()) return
    setAdding(true)
    setAddError(null)

    const result = await createCategory(libraryId, newName)
    setAdding(false)

    if (!result.success) {
      setAddError(result.error ?? "Erro ao criar")
      return
    }

    setNewName("")
    router.refresh()
    const { getCategories } = await import("@/lib/actions/categories")
    const updated = await getCategories(libraryId)
    setCategories(updated)
  }

  async function handleDelete() {
    if (!deleteId) return
    setDeleting(true)
    const result = await deleteCategory(deleteId, libraryId)
    setDeleting(false)
    if (!result.success) return
    setDeleteId(null)
    setCategories((prev) => prev.filter((c) => c.id !== deleteId))
    router.refresh()
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-medium mb-3">Categorias existentes</h3>
        {categories.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhuma categoria criada ainda.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <div
                key={cat.id}
                className="flex items-center gap-1 rounded-full border bg-secondary pl-3 pr-1 py-1"
              >
                <span className="text-sm">{cat.name}</span>
                <button
                  type="button"
                  onClick={() => setDeleteId(cat.id)}
                  className="rounded-full p-0.5 hover:bg-destructive/20 text-muted-foreground hover:text-destructive transition-colors"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <form onSubmit={handleAdd} className="flex gap-2">
        <Input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="Nome da nova categoria"
          className="flex-1"
        />
        <Button type="submit" disabled={adding || !newName.trim()}>
          {adding && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Adicionar
        </Button>
      </form>
      {addError && <p className="text-sm text-destructive">{addError}</p>}

      <AlertDialog open={!!deleteId} onOpenChange={(o) => { if (!o) setDeleteId(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir categoria</AlertDialogTitle>
            <AlertDialogDescription>
              Esta categoria será removida de todos os livros associados. Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? "Excluindo..." : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
