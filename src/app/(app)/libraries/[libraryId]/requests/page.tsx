import { redirect } from "next/navigation"
import Link from "next/link"
import { ChevronRight } from "lucide-react"
import { createClient } from "@/lib/supabase/server"
import { getLibrary } from "@/lib/actions/libraries"
import { getPendingRequests, getAllRequests } from "@/lib/actions/loanRequests"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { RequestsList } from "./RequestsList"
import { RequestsHistory } from "./RequestsHistory"

interface PageProps {
  params: Promise<{ libraryId: string }>
}

export default async function RequestsPage({ params }: PageProps) {
  const { libraryId } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const library = await getLibrary(libraryId)
  if (!library || library.role === "visitor") redirect(`/libraries/${libraryId}`)

  const [pending, all] = await Promise.all([
    getPendingRequests(libraryId),
    getAllRequests(libraryId),
  ])

  const history = all.filter((r) => r.status !== "pendente")

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/dashboard" className="hover:text-foreground">Dashboard</Link>
        <ChevronRight className="h-4 w-4" />
        <Link href={`/libraries/${libraryId}`} className="hover:text-foreground">{library.name}</Link>
        <ChevronRight className="h-4 w-4" />
        <span className="text-foreground">Solicitações</span>
      </div>

      <h1 className="text-2xl font-bold tracking-tight">Solicitações de empréstimo</h1>

      <Tabs defaultValue="pending">
        <TabsList>
          <TabsTrigger value="pending" className="flex items-center gap-2">
            Pendentes
            {pending.length > 0 && (
              <Badge className="h-5 min-w-5 px-1 text-xs bg-primary text-primary-foreground">
                {pending.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="history">Histórico</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="mt-6">
          <RequestsList requests={pending} />
        </TabsContent>

        <TabsContent value="history" className="mt-6">
          <RequestsHistory requests={history} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
