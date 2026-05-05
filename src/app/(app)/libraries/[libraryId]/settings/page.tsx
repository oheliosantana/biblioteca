import { redirect } from "next/navigation"
import Link from "next/link"
import { ChevronRight } from "lucide-react"
import { createClient } from "@/lib/supabase/server"
import { getLibrary } from "@/lib/actions/libraries"
import { getCategories } from "@/lib/actions/categories"
import { getMembers, getPendingInvites } from "@/lib/actions/members"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CategoriesManager } from "./CategoriesManager"
import { MembersManager } from "./MembersManager"

interface PageProps {
  params: Promise<{ libraryId: string }>
}

export default async function SettingsPage({ params }: PageProps) {
  const { libraryId } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const library = await getLibrary(libraryId)
  if (!library || library.role === "visitor") redirect(`/libraries/${libraryId}`)

  const [categories, members, invites] = await Promise.all([
    getCategories(libraryId),
    getMembers(libraryId),
    getPendingInvites(libraryId),
  ])

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/dashboard" className="hover:text-foreground">Dashboard</Link>
        <ChevronRight className="h-4 w-4" />
        <Link href={`/libraries/${libraryId}`} className="hover:text-foreground">{library.name}</Link>
        <ChevronRight className="h-4 w-4" />
        <span className="text-foreground">Configurações</span>
      </div>

      <h1 className="text-2xl font-bold tracking-tight">Configurações da biblioteca</h1>

      <Tabs defaultValue="categories">
        <TabsList>
          <TabsTrigger value="categories">Categorias</TabsTrigger>
          <TabsTrigger value="members">Membros</TabsTrigger>
        </TabsList>

        <TabsContent value="categories" className="mt-6">
          <CategoriesManager libraryId={libraryId} initialCategories={categories} />
        </TabsContent>

        <TabsContent value="members" className="mt-6">
          <MembersManager
            libraryId={libraryId}
            currentUserId={user.id}
            isOwner={library.role === "owner"}
            initialMembers={members}
            initialInvites={invites}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
