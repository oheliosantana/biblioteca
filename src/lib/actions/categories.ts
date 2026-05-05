'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { Category } from '@/lib/types'

export async function getCategories(libraryId: string): Promise<Category[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('categories')
    .select('*')
    .eq('library_id', libraryId)
    .order('name')
  return data ?? []
}

export async function createCategory(
  libraryId: string,
  name: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()
  const trimmed = name.trim()
  if (!trimmed) return { success: false, error: 'Nome é obrigatório' }

  const { error } = await supabase
    .from('categories')
    .insert({ library_id: libraryId, name: trimmed })

  if (error) return { success: false, error: error.message }

  revalidatePath(`/libraries/${libraryId}/settings`)
  return { success: true }
}

export async function deleteCategory(
  categoryId: string,
  libraryId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('categories')
    .delete()
    .eq('id', categoryId)

  if (error) return { success: false, error: error.message }

  revalidatePath(`/libraries/${libraryId}/settings`)
  return { success: true }
}
