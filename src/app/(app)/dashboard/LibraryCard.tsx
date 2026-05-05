"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { BookOpen, MoreVertical, Pencil, Trash2 } from "lucide-react"
import { deleteLibrary } from "@/lib/actions/libraries"
import { LibraryWithRole } from "@/lib/types"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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
import { LibraryDialog } from "./LibraryDialog"

const ICON_COLORS = [
  "bg-indigo-100 text-indigo-600",
  "bg-emerald-100 text-emerald-600",
  "bg-amber-100 text-amber-600",
  "bg-rose-100 text-rose-600",
]

const ROLE_LABELS: Record<LibraryWithRole["role"], string> = {
  owner: "Proprietário",
  manager: "Gerente",
  visitor: "Visitante",
}

const ROLE_VARIANTS: Record<LibraryWithRole["role"], "default" | "secondary" | "outline"> = {
  owner: "default",
  manager: "secondary",
  visitor: "outline",
}

interface LibraryCardProps {
  library: LibraryWithRole
  index: number
}

export function LibraryCard({ library, index }: LibraryCardProps) {
  const router = useRouter()
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  const colorClass = ICON_COLORS[index % ICON_COLORS.length]
  const canEdit = library.role === "owner" || library.role === "manager"

  async function handleDelete() {
    setDeleting(true)
    setDeleteError(null)
    const result = await deleteLibrary(library.id)
    setDeleting(false)
    if (!result.success) {
      setDeleteError(result.error ?? "Erro ao excluir")
      return
    }
    setDeleteOpen(false)
    router.refresh()
  }

  return (
    <>
      <Card className="group relative flex flex-col hover:shadow-md transition-shadow">
        {canEdit && (
          <div className="absolute right-2 top-2 z-10">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => e.preventDefault()}
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setEditOpen(true)}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Editar
                </DropdownMenuItem>
                {library.role === "owner" && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-destructive focus:text-destructive"
                      onClick={() => setDeleteOpen(true)}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Excluir
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}

        <Link href={`/libraries/${library.id}`} className="flex flex-col flex-1">
          <CardHeader className="pb-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colorClass} mb-3`}>
              <BookOpen className="h-5 w-5" />
            </div>
            <h3 className="font-semibold leading-tight pr-6">{library.name}</h3>
            {library.description && (
              <p className="text-sm text-muted-foreground line-clamp-2">{library.description}</p>
            )}
          </CardHeader>

          <CardContent className="flex-1" />

          <CardFooter className="flex items-center justify-between pt-0 pb-4">
            <span className="text-sm text-muted-foreground">
              {library.book_count} {library.book_count === 1 ? "livro" : "livros"}
            </span>
            <Badge variant={ROLE_VARIANTS[library.role]}>
              {ROLE_LABELS[library.role]}
            </Badge>
          </CardFooter>
        </Link>
      </Card>

      <LibraryDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        library={library}
      />

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir biblioteca</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza? Esta ação não pode ser desfeita. Todos os livros desta
              biblioteca serão permanentemente excluídos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {deleteError && (
            <p className="text-sm text-destructive">{deleteError}</p>
          )}
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
    </>
  )
}
