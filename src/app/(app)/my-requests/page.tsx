import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { getMyRequests } from "@/lib/actions/loanRequests"
import { MyRequestsList } from "./MyRequestsList"

export default async function MyRequestsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const requests = await getMyRequests()

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Minhas solicitações</h1>
      <MyRequestsList requests={requests} />
    </div>
  )
}
