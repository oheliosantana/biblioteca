import { Suspense } from "react"
import { redirect } from "next/navigation"
import Link from "next/link"
import { BookOpen } from "lucide-react"
import { createClient } from "@/lib/supabase/server"
import { searchAllLibraries } from "@/lib/actions/search"
import { Badge } from "@/components/ui/badge"
import { SearchInput } from "./SearchInput"

const POSSESSION_LABELS: Record<string, string> = {
  comigo: "Disponível",
  emprestado: "Emprestado",
}
const POSSESSION_STYLES: Record<string, string> = {
  comigo: "bg-green-100 text-green-700 border-green-200",
  emprestado: "bg-orange-100 text-orange-700 border-orange-200",
}

interface PageProps {
  searchParams: Promise<{ q?: string }>
}

async function Results({ query }: { query: string }) {
  if (!query || query.trim().length < 2) {
    return (
      <p className="text-sm text-muted-foreground text-center py-8">
        Digite pelo menos 2 caracteres para buscar.
      </p>
    )
  }

  const results = await searchAllLibraries(query)

  if (results.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed bg-muted/30 py-16 text-center">
        <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium">Nenhum resultado</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Nenhum livro encontrado para "{query}".
        </p>
      </div>
    )
  }

  const grouped = results.reduce<Record<string, typeof results>>((acc, r) => {
    const key = r.library_name || r.library_id
    if (!acc[key]) acc[key] = []
    acc[key].push(r)
    return acc
  }, {})

  return (
    <div className="space-y-8">
      <p className="text-sm text-muted-foreground">
        {results.length} resultado{results.length !== 1 ? "s" : ""} encontrado{results.length !== 1 ? "s" : ""}
      </p>
      {Object.entries(grouped).map(([libraryName, books]) => (
        <div key={libraryName}>
          <h2 className="text-base font-semibold mb-3">{libraryName}</h2>
          <div className="rounded-lg border divide-y">
            {books.map((book) => (
              <Link
                key={book.id}
                href={`/libraries/${book.library_id}/books/${book.id}`}
                className="flex items-center gap-4 px-4 py-3 hover:bg-muted/50 transition-colors"
              >
                {book.cover_url ? (
                  <img src={book.cover_url} alt={book.title} className="w-8 h-11 object-cover rounded shadow-sm shrink-0" />
                ) : (
                  <div className="w-8 h-11 bg-muted rounded flex items-center justify-center shrink-0">
                    <BookOpen className="h-4 w-4 text-muted-foreground" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium line-clamp-1">{book.title}</p>
                  <p className="text-xs text-muted-foreground line-clamp-1">{book.authors.join(", ")}</p>
                </div>
                {book.ownership_status === "possuido" && POSSESSION_LABELS[book.possession_status] && (
                  <Badge variant="outline" className={`shrink-0 text-xs ${POSSESSION_STYLES[book.possession_status]}`}>
                    {POSSESSION_LABELS[book.possession_status]}
                  </Badge>
                )}
              </Link>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

export default async function SearchPage({ searchParams }: PageProps) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { q } = await searchParams

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Buscar livros</h1>

      <Suspense>
        <SearchInput />
      </Suspense>

      <Suspense fallback={<p className="text-sm text-muted-foreground">Buscando...</p>}>
        <Results query={q ?? ""} />
      </Suspense>
    </div>
  )
}
