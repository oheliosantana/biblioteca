'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { MemberWithProfile, LibraryInvite } from '@/lib/types'

async function assertIsManager(libraryId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: library } = await supabase
    .from('libraries')
    .select('owner_id')
    .eq('id', libraryId)
    .single()

  if (!library) return null
  if (library.owner_id === user.id) return user

  const { data: membership } = await supabase
    .from('library_members')
    .select('role')
    .eq('library_id', libraryId)
    .eq('user_id', user.id)
    .single()

  if (membership?.role === 'manager') return user
  return null
}

async function assertIsOwner(libraryId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: library } = await supabase
    .from('libraries')
    .select('owner_id')
    .eq('id', libraryId)
    .single()

  if (library?.owner_id === user.id) return user
  return null
}

export async function getMembers(libraryId: string): Promise<MemberWithProfile[]> {
  const supabase = await createClient()

  const { data: library } = await supabase
    .from('libraries')
    .select('owner_id, created_at')
    .eq('id', libraryId)
    .single()

  if (!library) return []

  const { data: ownerProfile } = await supabase
    .from('profiles')
    .select('display_name, email')
    .eq('id', library.owner_id)
    .single()

  const owner: MemberWithProfile = {
    user_id: library.owner_id,
    display_name: ownerProfile?.display_name ?? null,
    email: ownerProfile?.email ?? null,
    role: 'owner',
    joined_at: library.created_at,
  }

  const { data: members } = await supabase
    .from('library_members')
    .select('user_id, role, created_at')
    .eq('library_id', libraryId)
    .order('created_at', { ascending: true })

  if (!members || members.length === 0) return [owner]

  const memberUserIds = members.map((m) => m.user_id)
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, display_name, email')
    .in('id', memberUserIds)

  const profileMap: Record<string, { display_name: string | null; email: string | null }> = {}
  for (const p of profiles ?? []) {
    profileMap[p.id] = { display_name: p.display_name, email: p.email }
  }

  const membersList: MemberWithProfile[] = members.map((m) => ({
    user_id: m.user_id,
    display_name: profileMap[m.user_id]?.display_name ?? null,
    email: profileMap[m.user_id]?.email ?? null,
    role: m.role as 'manager' | 'visitor',
    joined_at: m.created_at,
  }))

  return [owner, ...membersList]
}

export async function inviteMember(
  libraryId: string,
  email: string,
  role: 'manager' | 'visitor'
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()
  const currentUser = await assertIsManager(libraryId)
  if (!currentUser) return { success: false, error: 'Sem permissão' }

  if (currentUser.email === email) {
    return { success: false, error: 'Você não pode convidar a si mesmo' }
  }

  const { data: existingProfile } = await supabase
    .from('profiles')
    .select('id, email')
    .eq('email', email)
    .single()

  if (existingProfile) {
    const { data: alreadyMember } = await supabase
      .from('library_members')
      .select('id')
      .eq('library_id', libraryId)
      .eq('user_id', existingProfile.id)
      .single()

    if (alreadyMember) {
      return { success: false, error: 'Este usuário já é membro da biblioteca' }
    }

    const { data: library } = await supabase
      .from('libraries')
      .select('owner_id')
      .eq('id', libraryId)
      .single()

    if (library?.owner_id === existingProfile.id) {
      return { success: false, error: 'Este usuário já é dono da biblioteca' }
    }

    const { error } = await supabase.from('library_members').insert({
      library_id: libraryId,
      user_id: existingProfile.id,
      role,
    })

    if (error) return { success: false, error: error.message }
    revalidatePath(`/libraries/${libraryId}/settings`)
    return { success: true }
  }

  const { data: existingInvite } = await supabase
    .from('library_invites')
    .select('id')
    .eq('library_id', libraryId)
    .eq('email', email)
    .single()

  if (existingInvite) {
    return { success: false, error: 'Já existe um convite pendente para este e-mail' }
  }

  const { error } = await supabase.from('library_invites').insert({
    library_id: libraryId,
    email,
    role,
    invited_by: currentUser.id,
  })

  if (error) return { success: false, error: error.message }
  revalidatePath(`/libraries/${libraryId}/settings`)
  return { success: true }
}

export async function removeMember(
  libraryId: string,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Não autenticado' }

  const { data: library } = await supabase
    .from('libraries')
    .select('owner_id')
    .eq('id', libraryId)
    .single()

  if (!library) return { success: false, error: 'Biblioteca não encontrada' }

  const isOwner = library.owner_id === user.id
  if (!isOwner) {
    const { data: myMembership } = await supabase
      .from('library_members')
      .select('role')
      .eq('library_id', libraryId)
      .eq('user_id', user.id)
      .single()

    if (myMembership?.role !== 'manager') {
      return { success: false, error: 'Sem permissão' }
    }

    const { data: targetMembership } = await supabase
      .from('library_members')
      .select('role')
      .eq('library_id', libraryId)
      .eq('user_id', userId)
      .single()

    if (targetMembership?.role === 'manager') {
      return { success: false, error: 'Gerentes só podem remover visitantes' }
    }
  }

  const { error } = await supabase
    .from('library_members')
    .delete()
    .eq('library_id', libraryId)
    .eq('user_id', userId)

  if (error) return { success: false, error: error.message }
  revalidatePath(`/libraries/${libraryId}/settings`)
  return { success: true }
}

export async function cancelInvite(
  inviteId: string,
  libraryId: string
): Promise<{ success: boolean; error?: string }> {
  const currentUser = await assertIsManager(libraryId)
  if (!currentUser) return { success: false, error: 'Sem permissão' }

  const supabase = await createClient()
  const { error } = await supabase
    .from('library_invites')
    .delete()
    .eq('id', inviteId)

  if (error) return { success: false, error: error.message }
  revalidatePath(`/libraries/${libraryId}/settings`)
  return { success: true }
}

export async function getPendingInvites(libraryId: string): Promise<LibraryInvite[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('library_invites')
    .select('*')
    .eq('library_id', libraryId)
    .order('created_at', { ascending: false })
  return data ?? []
}
