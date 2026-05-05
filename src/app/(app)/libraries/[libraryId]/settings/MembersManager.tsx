"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { format, parseISO } from "date-fns"
import { ptBR } from "date-fns/locale"
import { z } from "zod"
import { Loader2, UserMinus, X } from "lucide-react"
import { inviteMember, removeMember, cancelInvite } from "@/lib/actions/members"
import { MemberWithProfile, LibraryInvite } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { toast } from "sonner"

const ROLE_LABELS: Record<string, string> = {
  owner: "Proprietário",
  manager: "Gerente",
  visitor: "Visitante",
}

const AVATAR_COLORS = [
  "bg-indigo-500",
  "bg-emerald-500",
  "bg-amber-500",
  "bg-rose-500",
  "bg-violet-500",
  "bg-cyan-500",
]

function MemberAvatar({ name, index }: { name: string | null; index: number }) {
  const initials = name ? name.slice(0, 2).toUpperCase() : "??"
  const color = AVATAR_COLORS[index % AVATAR_COLORS.length]
  return (
    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-semibold ${color}`}>
      {initials}
    </div>
  )
}

interface MembersManagerProps {
  libraryId: string
  currentUserId: string
  isOwner: boolean
  initialMembers: MemberWithProfile[]
  initialInvites: LibraryInvite[]
}

export function MembersManager({
  libraryId,
  currentUserId,
  isOwner,
  initialMembers,
  initialInvites,
}: MembersManagerProps) {
  const router = useRouter()
  const [members, setMembers] = useState(initialMembers)
  const [invites, setInvites] = useState(initialInvites)
  const [removeTarget, setRemoveTarget] = useState<MemberWithProfile | null>(null)
  const [removing, setRemoving] = useState(false)

  const [inviteEmail, setInviteEmail] = useState("")
  const [inviteRole, setInviteRole] = useState<"manager" | "visitor">("visitor")
  const [inviting, setInviting] = useState(false)
  const [inviteError, setInviteError] = useState<string | null>(null)

  const emailSchema = z.string().email("E-mail inválido")

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault()
    const parsed = emailSchema.safeParse(inviteEmail)
    if (!parsed.success) {
      setInviteError(parsed.error.issues[0].message)
      return
    }

    setInviting(true)
    setInviteError(null)
    const result = await inviteMember(libraryId, inviteEmail, inviteRole)
    setInviting(false)

    if (!result.success) {
      setInviteError(result.error ?? "Erro ao convidar")
      return
    }

    toast.success("Convite enviado com sucesso!")
    setInviteEmail("")
    router.refresh()

    const { getMembers, getPendingInvites } = await import("@/lib/actions/members")
    const [updatedMembers, updatedInvites] = await Promise.all([
      getMembers(libraryId),
      getPendingInvites(libraryId),
    ])
    setMembers(updatedMembers)
    setInvites(updatedInvites)
  }

  async function handleRemove() {
    if (!removeTarget) return
    setRemoving(true)
    const result = await removeMember(libraryId, removeTarget.user_id)
    setRemoving(false)
    if (!result.success) {
      toast.error(result.error ?? "Erro ao remover")
      setRemoveTarget(null)
      return
    }
    toast.success("Membro removido")
    setMembers((prev) => prev.filter((m) => m.user_id !== removeTarget.user_id))
    setRemoveTarget(null)
    router.refresh()
  }

  async function handleCancelInvite(inviteId: string) {
    const result = await cancelInvite(inviteId, libraryId)
    if (!result.success) {
      toast.error(result.error ?? "Erro ao cancelar convite")
      return
    }
    toast.success("Convite cancelado")
    setInvites((prev) => prev.filter((i) => i.id !== inviteId))
    router.refresh()
  }

  function canRemoveMember(member: MemberWithProfile): boolean {
    if (member.role === "owner") return false
    if (member.user_id === currentUserId) return false
    if (isOwner) return true
    return member.role === "visitor"
  }

  return (
    <div className="space-y-8">
      {/* Membros ativos */}
      <div>
        <h3 className="font-medium mb-3">Membros ativos</h3>
        <div className="rounded-lg border divide-y">
          {members.map((member, i) => (
            <div key={member.user_id} className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-3">
                <MemberAvatar name={member.display_name} index={i} />
                <div>
                  <p className="text-sm font-medium">{member.display_name ?? member.email ?? "Usuário"}</p>
                  <p className="text-xs text-muted-foreground">
                    Desde {format(parseISO(member.joined_at), "dd/MM/yyyy", { locale: ptBR })}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge
                  variant={member.role === "owner" ? "default" : member.role === "manager" ? "secondary" : "outline"}
                >
                  {ROLE_LABELS[member.role]}
                </Badge>
                {canRemoveMember(member) && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-destructive"
                    onClick={() => setRemoveTarget(member)}
                  >
                    <UserMinus className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Convites pendentes */}
      <div>
        <h3 className="font-medium mb-3">Convites pendentes</h3>
        {invites.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum convite pendente.</p>
        ) : (
          <div className="rounded-lg border divide-y">
            {invites.map((invite) => (
              <div key={invite.id} className="flex items-center justify-between px-4 py-3">
                <div>
                  <p className="text-sm font-medium">{invite.email}</p>
                  <p className="text-xs text-muted-foreground">
                    {format(parseISO(invite.created_at), "dd/MM/yyyy", { locale: ptBR })}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant="outline">{ROLE_LABELS[invite.role]}</Badge>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-destructive"
                    onClick={() => handleCancelInvite(invite.id)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Form de convite */}
      <div>
        <h3 className="font-medium mb-3">Convidar pessoa</h3>
        <form onSubmit={handleInvite} className="flex gap-2 flex-wrap">
          <Input
            type="email"
            placeholder="email@exemplo.com"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            className="flex-1 min-w-[200px]"
          />
          <Select value={inviteRole} onValueChange={(v) => setInviteRole(v as "manager" | "visitor")}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="visitor">Visitante</SelectItem>
              <SelectItem value="manager">Gerente</SelectItem>
            </SelectContent>
          </Select>
          <Button type="submit" disabled={inviting || !inviteEmail}>
            {inviting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Convidar
          </Button>
        </form>
        {inviteError && <p className="text-sm text-destructive mt-2">{inviteError}</p>}
      </div>

      <AlertDialog open={!!removeTarget} onOpenChange={(o) => { if (!o) setRemoveTarget(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover membro</AlertDialogTitle>
            <AlertDialogDescription>
              Remover <strong>{removeTarget?.display_name ?? removeTarget?.email}</strong> desta biblioteca?
              Esta pessoa perderá acesso a todos os livros.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={removing}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemove}
              disabled={removing}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {removing ? "Removendo..." : "Remover"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
