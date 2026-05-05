'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { Loan } from '@/lib/types'

interface CreateLoanData {
  borrowerName: string
  loanedAt: string
  dueDate?: string
  notes?: string
}

export async function createLoan(
  bookId: string,
  data: CreateLoanData
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

  const { error: loanError } = await supabase.from('loans').insert({
    book_id: bookId,
    borrower_name: data.borrowerName,
    loaned_at: data.loanedAt,
    due_date: data.dueDate || null,
    notes: data.notes || null,
  })

  if (loanError) return { success: false, error: loanError.message }

  await supabase
    .from('books')
    .update({ possession_status: 'emprestado', updated_at: new Date().toISOString() })
    .eq('id', bookId)

  revalidatePath(`/libraries/${book.library_id}/books/${bookId}`)
  return { success: true }
}

export async function returnLoan(
  loanId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Não autenticado' }

  const { data: loan } = await supabase
    .from('loans')
    .select('book_id')
    .eq('id', loanId)
    .single()

  if (!loan) return { success: false, error: 'Empréstimo não encontrado' }

  const { error } = await supabase
    .from('loans')
    .update({ returned_at: new Date().toISOString().split('T')[0] })
    .eq('id', loanId)

  if (error) return { success: false, error: error.message }

  const { data: book } = await supabase
    .from('books')
    .select('library_id')
    .eq('id', loan.book_id)
    .single()

  await supabase
    .from('books')
    .update({ possession_status: 'comigo', updated_at: new Date().toISOString() })
    .eq('id', loan.book_id)

  if (book) {
    revalidatePath(`/libraries/${book.library_id}/books/${loan.book_id}`)
    revalidatePath('/dashboard')
  }
  return { success: true }
}

export async function getActiveLoan(bookId: string): Promise<Loan | null> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('loans')
    .select('*')
    .eq('book_id', bookId)
    .is('returned_at', null)
    .single()
  return data ?? null
}

export async function getLoanHistory(bookId: string): Promise<Loan[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('loans')
    .select('*')
    .eq('book_id', bookId)
    .not('returned_at', 'is', null)
    .order('created_at', { ascending: false })
  return data ?? []
}

export interface OverdueLoan {
  id: string
  book_id: string
  book_title: string
  library_id: string
  library_name: string
  borrower_name: string
  due_date: string
}

export async function getOverdueAndSoonLoans(): Promise<{
  overdue: OverdueLoan[]
  soonDue: OverdueLoan[]
}> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { overdue: [], soonDue: [] }

  const { data: ownedLibraries } = await supabase
    .from('libraries')
    .select('id, name')
    .eq('owner_id', user.id)

  const { data: memberLibraries } = await supabase
    .from('library_members')
    .select('library_id')
    .eq('user_id', user.id)
    .eq('role', 'manager')

  const libraryIds = [
    ...(ownedLibraries ?? []).map((l) => l.id),
    ...(memberLibraries ?? []).map((m) => m.library_id),
  ]

  if (libraryIds.length === 0) return { overdue: [], soonDue: [] }

  const { data: books } = await supabase
    .from('books')
    .select('id, title, library_id')
    .in('library_id', libraryIds)

  if (!books || books.length === 0) return { overdue: [], soonDue: [] }

  const bookIds = books.map((b) => b.id)
  const today = new Date().toISOString().split('T')[0]
  const weekLater = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

  const { data: loans } = await supabase
    .from('loans')
    .select('*')
    .in('book_id', bookIds)
    .is('returned_at', null)
    .not('due_date', 'is', null)

  const allLibraries = [
    ...(ownedLibraries ?? []),
    ...(memberLibraries ?? []).map((m) => {
      const found = ownedLibraries?.find((l) => l.id === m.library_id)
      return found ?? { id: m.library_id, name: m.library_id }
    }),
  ]

  const overdue: OverdueLoan[] = []
  const soonDue: OverdueLoan[] = []

  for (const loan of loans ?? []) {
    if (!loan.due_date) continue
    const book = books.find((b) => b.id === loan.book_id)
    if (!book) continue
    const library = allLibraries.find((l) => l.id === book.library_id)

    const item: OverdueLoan = {
      id: loan.id,
      book_id: loan.book_id,
      book_title: book.title,
      library_id: book.library_id,
      library_name: library?.name ?? '',
      borrower_name: loan.borrower_name,
      due_date: loan.due_date,
    }

    if (loan.due_date < today) {
      overdue.push(item)
    } else if (loan.due_date <= weekLater) {
      soonDue.push(item)
    }
  }

  return { overdue, soonDue }
}

export interface MyActiveLoan {
  id: string
  book_id: string
  book_title: string
  book_cover_url: string | null
  book_authors: string[]
  library_id: string
  library_name: string
  loaned_at: string
  due_date: string | null
}

export async function getMyActiveLoans(): Promise<MyActiveLoan[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data: loans } = await supabase
    .from('loans')
    .select('*')
    .eq('borrower_user_id', user.id)
    .is('returned_at', null)
    .order('loaned_at', { ascending: false })

  if (!loans || loans.length === 0) return []

  const bookIds = [...new Set(loans.map((l) => l.book_id))]
  const { data: books } = await supabase
    .from('books')
    .select('id, title, cover_url, authors, library_id')
    .in('id', bookIds)

  const bookMap: Record<string, { title: string; cover_url: string | null; authors: string[]; library_id: string }> = {}
  const libraryIds: string[] = []
  for (const b of books ?? []) {
    bookMap[b.id] = { title: b.title, cover_url: b.cover_url, authors: b.authors, library_id: b.library_id }
    libraryIds.push(b.library_id)
  }

  const { data: libraries } = await supabase
    .from('libraries')
    .select('id, name')
    .in('id', [...new Set(libraryIds)])

  const libraryMap: Record<string, string> = {}
  for (const l of libraries ?? []) libraryMap[l.id] = l.name

  return loans.map((loan) => ({
    id: loan.id,
    book_id: loan.book_id,
    book_title: bookMap[loan.book_id]?.title ?? '',
    book_cover_url: bookMap[loan.book_id]?.cover_url ?? null,
    book_authors: bookMap[loan.book_id]?.authors ?? [],
    library_id: bookMap[loan.book_id]?.library_id ?? '',
    library_name: libraryMap[bookMap[loan.book_id]?.library_id ?? ''] ?? '',
    loaned_at: loan.loaned_at,
    due_date: loan.due_date,
  }))
}
