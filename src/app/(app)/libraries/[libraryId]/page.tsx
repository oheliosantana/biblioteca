import { redirect } from "next/navigation"
import Link from "next/link"
import { Plus, Settings, ChevronRight } from "lucide-react"
import { getLibrary } from "@/lib/actions/libraries"
import { getBooks } from "@/lib/actions/books"
import { getCategories } from "@/lib/actions/categories"
import { OwnershipStatus, PossessionStatus } from "@/lib/types"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { BooksFilter } from "./BooksFilter"
import { BooksTable } from "@/components/books/BooksTable"
import { Suspense } from "react"

const ROLE_LABELS = { owner: "Proprietário", manager: "Gerente", visitor: "Visitante" }

interface PageProps {
  params: Promise<{ libraryId: string }>
  searchParams: Promise<{ search?: string; ownership?: string; possession?: string; category?: string; page?: string }>
}

export default async function LibraryPage({ params, searchParams }: PageProps) {
  const { libraryId } = await params
  const sp = await searchParams

  const library = await getLibrary(libraryId)
  if (!library) redirect("/dashboard")

  const canEdit = library.role === "owner" || library.role === "manager"
  const page = parseInt(sp.page ?? "1") || 1

  const [{ books, count }, categories] = await Promise.all([
    getBooks(libraryId, {
      search: sp.search,
      ownership: sp.ownership as OwnershipStatus | undefined,
      possession: sp.possession as PossessionStatus | undefined,
      categoryId: sp.category,
      page,
    }),
    getCategories(libraryId),
  ])

  const hasFilters = !!(sp.search || sp.ownership || sp.possession || sp.category)

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/dashboard" className="hover:text-foreground transition-colors">
          Dashboard
        </Link>
        <ChevronRight className="h-4 w-4" />
        <span className="text-foreground">{library.name}</span>
      </div>

      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold tracking-tight">{library.name}</h1>
            <Badge variant="secondary">{ROLE_LABELS[library.role]}</Badge>
          </div>
          {library.description && (
            <p className="text-muted-foreground mt-1">{library.description}</p>
          )}
        </div>

        {canEdit && (
          <div className="flex items-center gap-2 shrink-0">
            <Button asChild variant="outline" size="icon">
              <Link href={`/libraries/${libraryId}/settings`}>
                <Settings className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild>
              <Link href={`/libraries/${libraryId}/books/new`}>
                <Plus className="mr-2 h-4 w-4" />
                Adicionar livro
              </Link>
            </Button>
          </div>
        )}
      </div>

      <Suspense>
        <BooksFilter categories={categories} />
      </Suspense>

      <BooksTable
        books={books}
        libraryId={libraryId}
        canEdit={canEdit}
        hasFilters={hasFilters}
        page={page}
        totalCount={count}
      />
    </div>
  )
}
