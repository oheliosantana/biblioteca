"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { ChevronRight } from "lucide-react"
import Link from "next/link"
import { getBook } from "@/lib/actions/books"
import { getCategories } from "@/lib/actions/categories"
import { BookWithCategories, Category } from "@/lib/types"
import { BookForm } from "@/components/books/BookForm"

interface PageProps {
  params: Promise<{ libraryId: string; bookId: string }>
}

export default function EditBookPage({ params }: PageProps) {
  const router = useRouter()
  const [libraryId, setLibraryId] = useState("")
  const [bookId, setBookId] = useState("")
  const [book, setBook] = useState<BookWithCategories | null>(null)
  const [categories, setCategories] = useState<Category[]>([])

  useEffect(() => {
    params.then(async ({ libraryId: lid, bookId: bid }) => {
      setLibraryId(lid)
      setBookId(bid)
      const [b, cats] = await Promise.all([getBook(bid), getCategories(lid)])
      setBook(b)
      setCategories(cats)
    })
  }, [params])

  if (!book) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/dashboard" className="hover:text-foreground">Dashboard</Link>
        <ChevronRight className="h-4 w-4" />
        <Link href={`/libraries/${libraryId}`} className="hover:text-foreground">Biblioteca</Link>
        <ChevronRight className="h-4 w-4" />
        <Link href={`/libraries/${libraryId}/books/${bookId}`} className="hover:text-foreground">
          {book.title}
        </Link>
        <ChevronRight className="h-4 w-4" />
        <span className="text-foreground">Editar</span>
      </div>

      <h1 className="text-2xl font-bold tracking-tight">Editar livro</h1>

      <BookForm
        libraryId={libraryId}
        book={book}
        categories={categories}
        onSuccess={() => router.push(`/libraries/${libraryId}/books/${bookId}`)}
      />
    </div>
  )
}
