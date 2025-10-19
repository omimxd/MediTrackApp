import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { HealthLogManager } from "@/components/health-log-manager"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"

export default async function HealthLogsPage() {
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
          <Button asChild variant="ghost" className="mb-4 text-teal-700 hover:text-teal-900">
            <Link href="/dashboard">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Link>
          </Button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-teal-900">Health Logs</h1>
              <p className="text-sm text-teal-700">Track your daily health notes and observations</p>
            </div>
          </div>
        </header>

        <HealthLogManager userId={user.id} />
      </div>
    </div>
  )
}
