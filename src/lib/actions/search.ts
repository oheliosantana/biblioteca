'use server'

import { createClient } from '@/lib/supabase/server'

export interface SearchResult {
  id: string
  title: string
  authors: string[]
  cover_url: string | null
  library_id: string
  library_name: string
  ownership_status: string
  possession_status: string
}

export async function searchAllLibraries(query: string): Promise<SearchResult[]> {
  if (!query || query.trim().length < 2) return []

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const [{ data: ownedLibs }, { data: memberLibs }] = await Promise.all([
    supabase.from('libraries').select('id, name').eq('owner_id', user.id),
    supabase.from('library_members').select('library_id').eq('user_id', user.id),
  ])

  const libraryIds = [
    ...(ownedLibs ?? []).map((l) => l.id),
    ...(memberLibs ?? []).map((m) => m.library_id),
  ]

  if (libraryIds.length === 0) return []

  const libraryMap: Record<string, string> = {}
  for (const l of ownedLibs ?? []) libraryMap[l.id] = l.name

  if (memberLibs && memberLibs.length > 0) {
    const memberLibraryIds = memberLibs.map((m) => m.library_id).filter((id) => !libraryMap[id])
    if (memberLibraryIds.length > 0) {
      const { data: libs } = await supabase
        .from('libraries')
        .select('id, name')
        .in('id', memberLibraryIds)
      for (const l of libs ?? []) libraryMap[l.id] = l.name
    }
  }

  const trimmed = query.trim()
  let booksQuery = supabase
    .from('books')
    .select('id, title, authors, cover_url, library_id, ownership_status, possession_status')
    .in('library_id', libraryIds)
    .limit(50)

  if (trimmed.split(' ').length === 1 && trimmed.length >= 2) {
    booksQuery = booksQuery.textSearch('search_tsv', trimmed, { type: 'websearch', config: 'portuguese' })
  } else {
    booksQuery = booksQuery.textSearch('search_tsv', trimmed, { type: 'websearch', config: 'portuguese' })
  }

  const { data: books } = await booksQuery

  return (books ?? []).map((b) => ({
    id: b.id,
    title: b.title,
    authors: b.authors,
    cover_url: b.cover_url,
    library_id: b.library_id,
    library_name: libraryMap[b.library_id] ?? '',
    ownership_status: b.ownership_status,
    possession_status: b.possession_status,
  }))
}
