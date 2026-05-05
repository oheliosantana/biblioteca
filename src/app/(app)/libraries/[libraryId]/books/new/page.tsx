"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { ChevronRight } from "lucide-react"
import Link from "next/link"
import { getCategories } from "@/lib/actions/categories"
import { Category } from "@/lib/types"
import { BookForm } from "@/components/books/BookForm"

interface PageProps {
  params: Promise<{ libraryId: string }>
}

export default function NewBookPage({ params }: PageProps) {
  const router = useRouter()
  const [libraryId, setLibraryId] = useState("")
  const [categories, setCategories] = useState<Category[]>([])

  useEffect(() => {
    params.then(({ libraryId: id }) => {
      setLibraryId(id)
      getCategories(id).then(setCategories)
    })
  }, [params])

  if (!libraryId) return null

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/dashboard" className="hover:text-foreground">Dashboard</Link>
        <ChevronRight className="h-4 w-4" />
        <Link href={`/libraries/${libraryId}`} className="hover:text-foreground">Biblioteca</Link>
        <ChevronRight className="h-4 w-4" />
        <span className="text-foreground">Novo livro</span>
      </div>

      <h1 className="text-2xl font-bold tracking-tight">Adicionar livro</h1>

      <BookForm
        libraryId={libraryId}
        categories={categories}
        onSuccess={() => router.push(`/libraries/${libraryId}`)}
      />
    </div>
  )
}
