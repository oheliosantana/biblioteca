'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { BookWithCategories, OwnershipStatus, PossessionStatus } from '@/lib/types'

const bookSchema = z.object({
  title: z.string().min(1, 'Título é obrigatório'),
  authors: z.array(z.string().min(1)).min(1, 'Ao menos um autor é obrigatório'),
  isbn: z.string().optional(),
  edition: z.string().optional(),
  publisher: z.string().optional(),
  publication_year: z.number().int().min(1000).max(2100).optional().nullable(),
  language: z.string().optional(),
  pages: z.number().int().positive().optional().nullable(),
  synopsis: z.string().optional(),
  cover_url: z.string().url().optional().or(z.literal('')),
  shelf: z.string().optional(),
  rack: z.string().optional(),
  ownership_status: z.enum(['desejado', 'possuido', 'desfeito']),
  possession_status: z.enum(['comigo', 'emprestado']),
  rating: z.number().int().min(0).max(5).optional().nullable(),
  notes: z.string().optional(),
  category_ids: z.array(z.string().uuid()).optional(),
})

export type BookFormData = z.infer<typeof bookSchema>

interface GetBooksOptions {
  search?: string
  ownership?: OwnershipStatus
  possession?: PossessionStatus
  categoryId?: string
  page?: number
}

export async function getBooks(
  libraryId: string,
  options: GetBooksOptions = {}
): Promise<{ books: BookWithCategories[]; count: number }> {
  const supabase = await createClient()
  const { search, ownership, possession, categoryId, page = 1 } = options
  const pageSize = 50
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  let query = supabase
    .from('books')
    .select('*', { count: 'exact' })
    .eq('library_id', libraryId)
    .order('created_at', { ascending: false })
    .range(from, to)

  if (search) {
    query = query.textSearch('search_tsv', search, { type: 'websearch', config: 'portuguese' })
  }
  if (ownership) query = query.eq('ownership_status', ownership)
  if (possession) query = query.eq('possession_status', possession)

  const { data: books, count, error } = await query

  if (error || !books) return { books: [], count: 0 }

  let filteredBookIds = books.map((b) => b.id)

  if (categoryId) {
    const { data: bookCats } = await supabase
      .from('book_categories')
      .select('book_id')
      .eq('category_id', categoryId)
      .in('book_id', filteredBookIds)

    filteredBookIds = (bookCats ?? []).map((bc) => bc.book_id)
  }

  const filteredBooks = categoryId
    ? books.filter((b) => filteredBookIds.includes(b.id))
    : books

  type BookCategoryRow = { book_id: string; categories: BookWithCategories['categories'][number] | null }
  const { data: bookCategories } = await supabase
    .from('book_categories')
    .select('book_id, categories(*)')
    .in('book_id', filteredBooks.map((b) => b.id)) as { data: BookCategoryRow[] | null }

  const categoryMap: Record<string, BookWithCategories['categories']> = {}
  for (const bc of bookCategories ?? []) {
    if (!categoryMap[bc.book_id]) categoryMap[bc.book_id] = []
    if (bc.categories) {
      categoryMap[bc.book_id].push(bc.categories)
    }
  }

  return {
    books: filteredBooks.map((b) => ({
      ...b,
      categories: categoryMap[b.id] ?? [],
    })),
    count: count ?? 0,
  }
}

export async function getBook(bookId: string): Promise<BookWithCategories | null> {
  const supabase = await createClient()

  const { data: book } = await supabase
    .from('books')
    .select('*')
    .eq('id', bookId)
    .single()

  if (!book) return null

  type BookCatRow = { categories: BookWithCategories['categories'][number] | null }
  const { data: bookCategories } = await supabase
    .from('book_categories')
    .select('categories(*)')
    .eq('book_id', bookId) as { data: BookCatRow[] | null }

  const categories = (bookCategories ?? [])
    .map((bc) => bc.categories)
    .filter(Boolean) as BookWithCategories['categories']

  return { ...book, categories }
}

export async function createBook(
  libraryId: string,
  data: BookFormData
): Promise<{ success: boolean; data?: BookWithCategories; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Não autenticado' }

  const parsed = bookSchema.safeParse(data)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message }
  }

  const { category_ids, ...bookData } = parsed.data

  const { data: book, error } = await supabase
    .from('books')
    .insert({ ...bookData, library_id: libraryId })
    .select()
    .single()

  if (error || !book) return { success: false, error: error?.message ?? 'Erro ao criar livro' }

  if (category_ids && category_ids.length > 0) {
    await supabase.from('book_categories').insert(
      category_ids.map((id) => ({ book_id: book.id, category_id: id }))
    )
  }

  revalidatePath(`/libraries/${libraryId}`)
  return { success: true, data: { ...book, categories: [] } }
}

export async function updateBook(
  bookId: string,
  data: BookFormData
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Não autenticado' }

  const { data: book } = await supabase
    .from('books')
    .select('library_id')
    .eq('id', bookId)
    .single()

  if (!book) return { success: false, error: 'Livro não encontrado' }

  const parsed = bookSchema.safeParse(data)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message }
  }

  const { category_ids, ...bookData } = parsed.data

  const { error } = await supabase
    .from('books')
    .update({ ...bookData, updated_at: new Date().toISOString() })
    .eq('id', bookId)

  if (error) return { success: false, error: error.message }

  await supabase.from('book_categories').delete().eq('book_id', bookId)

  if (category_ids && category_ids.length > 0) {
    await supabase.from('book_categories').insert(
      category_ids.map((id) => ({ book_id: bookId, category_id: id }))
    )
  }

  revalidatePath(`/libraries/${book.library_id}`)
  revalidatePath(`/libraries/${book.library_id}/books/${bookId}`)
  return { success: true }
}

export async function deleteBook(
  bookId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  const { data: activeLoan } = await supabase
    .from('loans')
    .select('id')
    .eq('book_id', bookId)
    .is('returned_at', null)
    .single()

  if (activeLoan) {
    return { success: false, error: 'Livro está emprestado' }
  }

  const { data: book } = await supabase
    .from('books')
    .select('library_id')
    .eq('id', bookId)
    .single()

  const { error } = await supabase.from('books').delete().eq('id', bookId)

  if (error) return { success: false, error: error.message }

  if (book) {
    revalidatePath(`/libraries/${book.library_id}`)
  }
  return { success: true }
}
