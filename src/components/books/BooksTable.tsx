"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { BookOpen, Star, Pencil, Trash2 } from "lucide-react"
import { deleteBook } from "@/lib/actions/books"
import { BookWithCategories } from "@/lib/types"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
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

const OWNERSHIP_LABELS: Record<string, string> = {
  desejado: "Desejado",
  possuido: "Possuído",
  desfeito: "Desfeito",
}

const OWNERSHIP_COLORS: Record<string, string> = {
  desejado: "bg-blue-100 text-blue-700 border-blue-200",
  possuido: "bg-green-100 text-green-700 border-green-200",
  desfeito: "bg-zinc-100 text-zinc-500 border-zinc-200",
}

const POSSESSION_LABELS: Record<string, string> = {
  comigo: "Comigo",
  emprestado: "Emprestado",
}

const POSSESSION_COLORS: Record<string, string> = {
  comigo: "bg-green-100 text-green-700 border-green-200",
  emprestado: "bg-orange-100 text-orange-700 border-orange-200",
}

interface BooksTableProps {
  books: BookWithCategories[]
  libraryId: string
  canEdit: boolean
  hasFilters: boolean
  page: number
  totalCount: number
}

export function BooksTable({
  books,
  libraryId,
  canEdit,
  hasFilters,
  page,
  totalCount,
}: BooksTableProps) {
  const router = useRouter()
  const [deleteBookId, setDeleteBookId] = useState<string | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  const totalPages = Math.ceil(totalCount / 50)

  async function handleDelete() {
    if (!deleteBookId) return
    setDeleting(true)
    setDeleteError(null)
    const result = await deleteBook(deleteBookId)
    setDeleting(false)
    if (!result.success) {
      setDeleteError(result.error ?? "Erro ao excluir")
      return
    }
    setDeleteBookId(null)
    router.refresh()
  }

  if (books.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed bg-muted/30 py-16 text-center">
        <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
        {hasFilters ? (
          <>
            <h3 className="text-lg font-medium">Nenhum livro encontrado</h3>
            <p className="text-muted-foreground text-sm mt-1">Tente ajustar ou limpar os filtros.</p>
          </>
        ) : (
          <>
            <h3 className="text-lg font-medium">Nenhum livro cadastrado</h3>
            {canEdit && (
              <Button asChild className="mt-4">
                <Link href={`/libraries/${libraryId}/books/new`}>Adicionar primeiro livro</Link>
              </Button>
            )}
          </>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground w-12"></th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Título</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">Localização</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden sm:table-cell">Status</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden lg:table-cell">Avaliação</th>
              {canEdit && <th className="px-4 py-3 w-20"></th>}
            </tr>
          </thead>
          <tbody className="divide-y">
            {books.map((book) => (
              <tr
                key={book.id}
                className="hover:bg-muted/30 cursor-pointer"
                onClick={() => router.push(`/libraries/${libraryId}/books/${book.id}`)}
              >
                <td className="px-4 py-3">
                  {book.cover_url ? (
                    <img
                      src={book.cover_url}
                      alt={book.title}
                      className="w-10 h-14 object-cover rounded shadow-sm"
                    />
                  ) : (
                    <div className="w-10 h-14 bg-muted rounded flex items-center justify-center">
                      <BookOpen className="h-4 w-4 text-muted-foreground" />
                    </div>
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="font-medium line-clamp-1">{book.title}</div>
                  <div className="text-muted-foreground text-xs mt-0.5 line-clamp-1">
                    {book.authors.join(", ")}
                  </div>
                </td>
                <td className="px-4 py-3 hidden md:table-cell text-muted-foreground">
                  {book.shelf || book.rack
                    ? [book.shelf && `Est. ${book.shelf}`, book.rack && `Prat. ${book.rack}`]
                        .filter(Boolean)
                        .join(", ")
                    : "—"}
                </td>
                <td className="px-4 py-3 hidden sm:table-cell">
                  <div className="flex flex-col gap-1">
                    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${OWNERSHIP_COLORS[book.ownership_status]}`}>
                      {OWNERSHIP_LABELS[book.ownership_status]}
                    </span>
                    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${POSSESSION_COLORS[book.possession_status]}`}>
                      {POSSESSION_LABELS[book.possession_status]}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3 hidden lg:table-cell">
                  {book.rating ? (
                    <div className="flex items-center gap-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`h-3.5 w-3.5 ${i < book.rating! ? "fill-amber-400 text-amber-400" : "text-muted-foreground"}`}
                        />
                      ))}
                    </div>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </td>
                {canEdit && (
                  <td className="px-4 py-3">
                    <div
                      className="flex items-center gap-1"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Button variant="ghost" size="icon" className="h-7 w-7" asChild>
                        <Link href={`/libraries/${libraryId}/books/${book.id}/edit`}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Link>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive hover:text-destructive"
                        onClick={() => setDeleteBookId(book.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            {Math.min((page - 1) * 50 + 1, totalCount)}–{Math.min(page * 50, totalCount)} de{" "}
            {totalCount}
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => router.push(`?page=${page - 1}`)}
            >
              Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => router.push(`?page=${page + 1}`)}
            >
              Próxima
            </Button>
          </div>
        </div>
      )}

      <AlertDialog open={!!deleteBookId} onOpenChange={(o) => { if (!o) setDeleteBookId(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir livro</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {deleteError && <p className="text-sm text-destructive">{deleteError}</p>}
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
