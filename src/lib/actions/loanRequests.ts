'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { LoanRequestWithDetails } from '@/lib/types'

export async function createLoanRequest(
  bookId: string,
  message?: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Não autenticado' }

  const { data: book } = await supabase
    .from('books')
    .select('library_id, possession_status, ownership_status')
    .eq('id', bookId)
    .single()

  if (!book) return { success: false, error: 'Livro não encontrado' }

  if (book.possession_status !== 'comigo' || book.ownership_status !== 'possuido') {
    return { success: false, error: 'Livro não disponível para empréstimo' }
  }

  const { data: library } = await supabase
    .from('libraries')
    .select('owner_id')
    .eq('id', book.library_id)
    .single()

  if (library?.owner_id === user.id) {
    return { success: false, error: 'Managers não podem solicitar empréstimos' }
  }

  const { data: membership } = await supabase
    .from('library_members')
    .select('role')
    .eq('library_id', book.library_id)
    .eq('user_id', user.id)
    .single()

  if (!membership) return { success: false, error: 'Sem acesso a esta biblioteca' }
  if (membership.role === 'manager') {
    return { success: false, error: 'Managers não fazem solicitações' }
  }

  const { data: existingRequest } = await supabase
    .from('loan_requests')
    .select('id')
    .eq('book_id', bookId)
    .eq('requester_id', user.id)
    .eq('status', 'pendente')
    .single()

  if (existingRequest) {
    return { success: false, error: 'Você já tem uma solicitação pendente para este livro' }
  }

  const { error } = await supabase.from('loan_requests').insert({
    book_id: bookId,
    requester_id: user.id,
    status: 'pendente',
    message: message || null,
  })

  if (error) return { success: false, error: error.message }
  revalidatePath(`/libraries/${book.library_id}/books/${bookId}`)
  return { success: true }
}

async function fetchRequestsWithDetails(
  libraryId: string,
  statusFilter?: string
): Promise<LoanRequestWithDetails[]> {
  const supabase = await createClient()

  const { data: books } = await supabase
    .from('books')
    .select('id, title, cover_url, authors')
    .eq('library_id', libraryId)

  if (!books || books.length === 0) return []

  const bookIds = books.map((b) => b.id)

  let query = supabase
    .from('loan_requests')
    .select('*')
    .in('book_id', bookIds)
    .order('created_at', { ascending: statusFilter === 'pendente' ? true : false })

  if (statusFilter) {
    query = query.eq('status', statusFilter as 'pendente' | 'aprovada' | 'rejeitada' | 'cancelada')
  }

  const { data: requests } = await query
  if (!requests || requests.length === 0) return []

  const requesterIds = [...new Set(requests.map((r) => r.requester_id))]
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, display_name')
    .in('id', requesterIds)

  const profileMap: Record<string, string | null> = {}
  for (const p of profiles ?? []) profileMap[p.id] = p.display_name

  const bookMap: Record<string, { title: string; cover_url: string | null; authors: string[] }> = {}
  for (const b of books) bookMap[b.id] = { title: b.title, cover_url: b.cover_url, authors: b.authors }

  const { data: library } = await supabase
    .from('libraries')
    .select('name')
    .eq('id', libraryId)
    .single()

  return requests.map((r) => ({
    ...r,
    book_title: bookMap[r.book_id]?.title ?? '',
    book_cover_url: bookMap[r.book_id]?.cover_url ?? null,
    book_authors: bookMap[r.book_id]?.authors ?? [],
    library_id: libraryId,
    library_name: library?.name ?? '',
    requester_display_name: profileMap[r.requester_id] ?? null,
  }))
}

export async function getPendingRequests(libraryId: string): Promise<LoanRequestWithDetails[]> {
  return fetchRequestsWithDetails(libraryId, 'pendente')
}

export async function getAllRequests(libraryId: string): Promise<LoanRequestWithDetails[]> {
  return fetchRequestsWithDetails(libraryId)
}

export async function approveRequest(
  requestId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Não autenticado' }

  const { data: request } = await supabase
    .from('loan_requests')
    .select('*')
    .eq('id', requestId)
    .single()

  if (!request) return { success: false, error: 'Solicitação não encontrada' }

  const { data: book } = await supabase
    .from('books')
    .select('library_id, title')
    .eq('id', request.book_id)
    .single()

  if (!book) return { success: false, error: 'Livro não encontrado' }

  const { data: requesterProfile } = await supabase
    .from('profiles')
    .select('display_name, email')
    .eq('id', request.requester_id)
    .single()

  const today = new Date().toISOString().split('T')[0]

  const { error: loanError } = await supabase.from('loans').insert({
    book_id: request.book_id,
    borrower_name: requesterProfile?.display_name ?? requesterProfile?.email ?? 'Visitante',
    borrower_user_id: request.requester_id,
    loaned_at: today,
  })

  if (loanError) return { success: false, error: loanError.message }

  await supabase
    .from('books')
    .update({ possession_status: 'emprestado', updated_at: new Date().toISOString() })
    .eq('id', request.book_id)

  await supabase
    .from('loan_requests')
    .update({
      status: 'aprovada',
      responded_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', requestId)

  revalidatePath(`/libraries/${book.library_id}/requests`)
  revalidatePath(`/libraries/${book.library_id}/books/${request.book_id}`)
  revalidatePath('/dashboard')
  return { success: true }
}

export async function rejectRequest(
  requestId: string,
  managerResponse?: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Não autenticado' }

  const { data: request } = await supabase
    .from('loan_requests')
    .select('book_id')
    .eq('id', requestId)
    .single()

  if (!request) return { success: false, error: 'Solicitação não encontrada' }

  const { data: book } = await supabase
    .from('books')
    .select('library_id')
    .eq('id', request.book_id)
    .single()

  const { error } = await supabase
    .from('loan_requests')
    .update({
      status: 'rejeitada',
      manager_response: managerResponse ?? null,
      responded_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', requestId)

  if (error) return { success: false, error: error.message }

  if (book) revalidatePath(`/libraries/${book.library_id}/requests`)
  return { success: true }
}

export async function cancelRequest(
  requestId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Não autenticado' }

  const { data: request } = await supabase
    .from('loan_requests')
    .select('requester_id, status, book_id')
    .eq('id', requestId)
    .single()

  if (!request) return { success: false, error: 'Solicitação não encontrada' }
  if (request.requester_id !== user.id) return { success: false, error: 'Sem permissão' }
  if (request.status !== 'pendente') return { success: false, error: 'Só é possível cancelar solicitações pendentes' }

  const { error } = await supabase
    .from('loan_requests')
    .update({ status: 'cancelada', updated_at: new Date().toISOString() })
    .eq('id', requestId)

  if (error) return { success: false, error: error.message }
  revalidatePath('/my-requests')
  return { success: true }
}

export async function getMyRequests(): Promise<LoanRequestWithDetails[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data: requests } = await supabase
    .from('loan_requests')
    .select('*')
    .eq('requester_id', user.id)
    .order('created_at', { ascending: false })

  if (!requests || requests.length === 0) return []

  const bookIds = [...new Set(requests.map((r) => r.book_id))]
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

  return requests.map((r) => ({
    ...r,
    book_title: bookMap[r.book_id]?.title ?? '',
    book_cover_url: bookMap[r.book_id]?.cover_url ?? null,
    book_authors: bookMap[r.book_id]?.authors ?? [],
    library_id: bookMap[r.book_id]?.library_id ?? '',
    library_name: libraryMap[bookMap[r.book_id]?.library_id ?? ''] ?? '',
    requester_display_name: null,
  }))
}

export async function getPendingRequestsCount(userId: string): Promise<number> {
  const supabase = await createClient()

  const [{ data: ownedLibs }, { data: managerLibs }] = await Promise.all([
    supabase.from('libraries').select('id').eq('owner_id', userId),
    supabase.from('library_members').select('library_id').eq('user_id', userId).eq('role', 'manager'),
  ])

  const libraryIds = [
    ...(ownedLibs ?? []).map((l) => l.id),
    ...(managerLibs ?? []).map((m) => m.library_id),
  ]

  if (libraryIds.length === 0) return 0

  const { data: bookIds } = await supabase
    .from('books')
    .select('id')
    .in('library_id', libraryIds)

  if (!bookIds || bookIds.length === 0) return 0

  const { count } = await supabase
    .from('loan_requests')
    .select('id', { count: 'exact', head: true })
    .in('book_id', bookIds.map((b) => b.id))
    .eq('status', 'pendente')

  return count ?? 0
}

export async function getMyPendingRequestsCount(userId: string): Promise<number> {
  const supabase = await createClient()
  const { count } = await supabase
    .from('loan_requests')
    .select('id', { count: 'exact', head: true })
    .eq('requester_id', userId)
    .eq('status', 'pendente')
  return count ?? 0
}
