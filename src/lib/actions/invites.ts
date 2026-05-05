'use server'

import { supabaseAdmin } from '@/lib/supabase/admin'

export async function processPendingInvites(email: string, userId: string): Promise<void> {
  const { data: invites } = await supabaseAdmin
    .from('library_invites')
    .select('*')
    .eq('email', email)

  if (!invites || invites.length === 0) return

  for (const invite of invites) {
    const { data: existingMember } = await supabaseAdmin
      .from('library_members')
      .select('id')
      .eq('library_id', invite.library_id)
      .eq('user_id', userId)
      .single()

    if (!existingMember) {
      await supabaseAdmin.from('library_members').insert({
        library_id: invite.library_id,
        user_id: userId,
        role: invite.role,
      })
    }

    await supabaseAdmin
      .from('library_invites')
      .delete()
      .eq('id', invite.id)
  }
}
