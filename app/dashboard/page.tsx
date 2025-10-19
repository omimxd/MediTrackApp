import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { ConditionsManager } from "@/components/conditions-manager"
import { AIGreeting } from "@/components/ai-greeting"

export default async function DashboardPage() {
  const supabase = await createClient()

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    redirect("/auth/login")
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-blue-50">
      <div className="container mx-auto p-6">
        <header className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-teal-900">MediTrack</h1>
              <p className="text-sm text-teal-700">Manage your health conditions and medications</p>
            </div>
            <form action="/auth/logout" method="post">
              <button
                type="submit"
                className="rounded-md bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700"
              >
                Logout
              </button>
            </form>
          </div>
        </header>

        <AIGreeting userName={user.email?.split("@")[0]} />

        <ConditionsManager userId={user.id} />
      </div>
    </div>
  )
}
