'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { Library, LibraryWithRole } from '@/lib/types'

const librarySchema = z.object({
  name: z.string().min(2, 'Nome deve ter ao menos 2 caracteres'),
  description: z.string().optional(),
})

export async function getMyLibraries(): Promise<LibraryWithRole[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const [{ data: owned }, { data: memberships }] = await Promise.all([
    supabase
      .from('libraries')
      .select('*')
      .eq('owner_id', user.id)
      .order('created_at', { ascending: false }),
    supabase
      .from('library_members')
      .select('library_id, role')
      .eq('user_id', user.id),
  ])

  let memberLibraries: LibraryWithRole[] = []

  if (memberships && memberships.length > 0) {
    const memberLibraryIds = memberships.map((m) => m.library_id)
    const { data: memberLibData } = await supabase
      .from('libraries')
      .select('*')
      .in('id', memberLibraryIds)

    memberLibraries = (memberLibData ?? []).map((lib) => {
      const membership = memberships.find((m) => m.library_id === lib.id)
      return {
        ...lib,
        role: (membership?.role ?? 'visitor') as 'manager' | 'visitor',
        book_count: 0,
      }
    })
  }

  const ownedLibraries: LibraryWithRole[] = (owned ?? []).map((lib) => ({
    ...lib,
    role: 'owner' as const,
    book_count: 0,
  }))

  const allLibraries = [...ownedLibraries, ...memberLibraries]
  if (allLibraries.length === 0) return []

  const libraryIds = allLibraries.map((l) => l.id)
  const { data: bookRows } = await supabase
    .from('books')
    .select('library_id')
    .in('library_id', libraryIds)

  const countMap: Record<string, number> = {}
  for (const row of bookRows ?? []) {
    countMap[row.library_id] = (countMap[row.library_id] ?? 0) + 1
  }

  return allLibraries.map((lib) => ({
    ...lib,
    book_count: countMap[lib.id] ?? 0,
  }))
}

export async function getLibrary(id: string): Promise<LibraryWithRole | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: library } = await supabase
    .from('libraries')
    .select('*')
    .eq('id', id)
    .single()

  if (!library) return null

  const { count } = await supabase
    .from('books')
    .select('*', { count: 'exact', head: true })
    .eq('library_id', id)

  if (library.owner_id === user.id) {
    return { ...library, role: 'owner', book_count: count ?? 0 }
  }

  const { data: membership } = await supabase
    .from('library_members')
    .select('role')
    .eq('library_id', id)
    .eq('user_id', user.id)
    .single()

  if (!membership) return null

  return {
    ...library,
    role: membership.role as 'manager' | 'visitor',
    book_count: count ?? 0,
  }
}

export async function createLibrary(
  formData: FormData
): Promise<{ success: boolean; data?: LibraryWithRole; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Não autenticado' }

  const parsed = librarySchema.safeParse({
    name: formData.get('name'),
    description: formData.get('description') || undefined,
  })

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message }
  }

  const { data, error } = await supabase
    .from('libraries')
    .insert({ ...parsed.data, owner_id: user.id })
    .select()
    .single()

  if (error) return { success: false, error: error.message }

  revalidatePath('/dashboard')
  return { success: true, data: { ...data, role: 'owner', book_count: 0 } }
}

export async function updateLibrary(
  id: string,
  formData: FormData
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Não autenticado' }

  const parsed = librarySchema.safeParse({
    name: formData.get('name'),
    description: formData.get('description') || undefined,
  })

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message }
  }

  const { error } = await supabase
    .from('libraries')
    .update({ ...parsed.data, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('owner_id', user.id)

  if (error) return { success: false, error: error.message }

  revalidatePath('/dashboard')
  revalidatePath(`/libraries/${id}`)
  return { success: true }
}

export async function deleteLibrary(
  id: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Não autenticado' }

  const { data: bookIds } = await supabase
    .from('books')
    .select('id')
    .eq('library_id', id)

  if (bookIds && bookIds.length > 0) {
    const ids = bookIds.map((b) => b.id)
    const { data: activeLoans } = await supabase
      .from('loans')
      .select('id')
      .in('book_id', ids)
      .is('returned_at', null)

    if (activeLoans && activeLoans.length > 0) {
      return { success: false, error: 'Há empréstimos ativos nesta biblioteca' }
    }
  }

  const { error } = await supabase
    .from('libraries')
    .delete()
    .eq('id', id)
    .eq('owner_id', user.id)

  if (error) return { success: false, error: error.message }

  revalidatePath('/dashboard')
  return { success: true }
}
