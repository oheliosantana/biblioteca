import { redirect } from "next/navigation"
import Link from "next/link"
import { ChevronRight, BookOpen, Star, MapPin } from "lucide-react"
import { createClient } from "@/lib/supabase/server"
import { getLibrary } from "@/lib/actions/libraries"
import { getBook } from "@/lib/actions/books"
import { getActiveLoan, getLoanHistory } from "@/lib/actions/loans"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { LoanSection } from "@/components/loans/LoanSection"
import { LoanRequestButton } from "@/components/loans/LoanRequestButton"

const OWNERSHIP_STYLES: Record<string, string> = {
  desejado: "bg-blue-100 text-blue-700 border-blue-200",
  possuido: "bg-green-100 text-green-700 border-green-200",
  desfeito: "bg-zinc-100 text-zinc-500 border-zinc-200",
}
const OWNERSHIP_LABELS: Record<string, string> = {
  desejado: "Desejado",
  possuido: "Possuído",
  desfeito: "Desfeito",
}
const POSSESSION_STYLES: Record<string, string> = {
  comigo: "bg-green-100 text-green-700 border-green-200",
  emprestado: "bg-orange-100 text-orange-700 border-orange-200",
}
const POSSESSION_LABELS: Record<string, string> = {
  comigo: "Comigo",
  emprestado: "Emprestado",
}

interface PageProps {
  params: Promise<{ libraryId: string; bookId: string }>
}

export default async function BookDetailPage({ params }: PageProps) {
  const { libraryId, bookId } = await params

  const [library, book] = await Promise.all([
    getLibrary(libraryId),
    getBook(bookId),
  ])

  if (!library || !book) redirect(`/libraries/${libraryId}`)

  const canEdit = library.role === "owner" || library.role === "manager"
  const isVisitor = library.role === "visitor"

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [activeLoan, loanHistory] = await Promise.all([
    getActiveLoan(bookId),
    getLoanHistory(bookId),
  ])

  let pendingRequest: { id: string } | null = null
  if (isVisitor && user) {
    const { data } = await supabase
      .from("loan_requests")
      .select("id")
      .eq("book_id", bookId)
      .eq("requester_id", user.id)
      .eq("status", "pendente")
      .single()
    pendingRequest = data
  }

  const details = [
    { label: "ISBN", value: book.isbn },
    { label: "Edição", value: book.edition },
    { label: "Editora", value: book.publisher },
    { label: "Ano", value: book.publication_year?.toString() },
    { label: "Idioma", value: book.language },
    { label: "Páginas", value: book.pages?.toString() },
  ].filter((d) => d.value)

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/dashboard" className="hover:text-foreground">Dashboard</Link>
        <ChevronRight className="h-4 w-4" />
        <Link href={`/libraries/${libraryId}`} className="hover:text-foreground">{library.name}</Link>
        <ChevronRight className="h-4 w-4" />
        <span className="text-foreground line-clamp-1">{book.title}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Coluna esquerda */}
        <div className="space-y-4">
          {book.cover_url ? (
            <img
              src={book.cover_url}
              alt={book.title}
              className="w-full aspect-[2/3] object-cover rounded-lg shadow-md"
            />
          ) : (
            <div className="w-full aspect-[2/3] bg-muted rounded-lg flex items-center justify-center shadow-md">
              <BookOpen className="h-16 w-16 text-muted-foreground" />
            </div>
          )}

          {canEdit && (
            <div className="space-y-2">
              <Button asChild className="w-full" variant="outline">
                <Link href={`/libraries/${libraryId}/books/${bookId}/edit`}>
                  Editar livro
                </Link>
              </Button>
            </div>
          )}

          {isVisitor && book.possession_status === "comigo" && book.ownership_status === "possuido" && (
            <LoanRequestButton
              bookId={bookId}
              hasPendingRequest={!!pendingRequest}
              pendingRequestId={pendingRequest?.id}
            />
          )}
        </div>

        {/* Coluna direita */}
        <div className="lg:col-span-2 space-y-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{book.title}</h1>
            <p className="text-lg text-muted-foreground mt-1">{book.authors.join(", ")}</p>
          </div>

          <div className="flex flex-wrap gap-2">
            <span className={`inline-flex items-center rounded-full border px-3 py-1 text-sm font-medium ${OWNERSHIP_STYLES[book.ownership_status]}`}>
              {OWNERSHIP_LABELS[book.ownership_status]}
            </span>
            <span className={`inline-flex items-center rounded-full border px-3 py-1 text-sm font-medium ${POSSESSION_STYLES[book.possession_status]}`}>
              {POSSESSION_LABELS[book.possession_status]}
            </span>
          </div>

          {book.rating !== null && book.rating > 0 && (
            <div className="flex items-center gap-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={`h-5 w-5 ${i < book.rating! ? "fill-amber-400 text-amber-400" : "text-muted"}`}
                />
              ))}
            </div>
          )}

          {details.length > 0 && (
            <>
              <Separator />
              <dl className="grid grid-cols-2 gap-3 text-sm">
                {details.map((d) => (
                  <div key={d.label}>
                    <dt className="text-muted-foreground">{d.label}</dt>
                    <dd className="font-medium">{d.value}</dd>
                  </div>
                ))}
              </dl>
            </>
          )}

          {(book.shelf || book.rack) && (
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span>
                {[book.shelf && `Estante ${book.shelf}`, book.rack && `Prateleira ${book.rack}`]
                  .filter(Boolean)
                  .join(", ")}
              </span>
            </div>
          )}

          {book.synopsis && (
            <>
              <Separator />
              <div>
                <h3 className="font-semibold mb-2">Sinopse</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{book.synopsis}</p>
              </div>
            </>
          )}

          {book.categories.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {book.categories.map((cat) => (
                <Badge key={cat.id} variant="secondary">{cat.name}</Badge>
              ))}
            </div>
          )}

          {book.notes && (
            <>
              <Separator />
              <div>
                <h3 className="font-semibold mb-2">Notas</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{book.notes}</p>
              </div>
            </>
          )}
        </div>
      </div>

      <LoanSection
        book={book}
        libraryId={libraryId}
        canEdit={canEdit}
        activeLoan={activeLoan}
        loanHistory={loanHistory}
      />
    </div>
  )
}
