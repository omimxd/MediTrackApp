import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { HealthInsightsAnalyzer } from "@/components/health-insights-analyzer"

export default async function InsightsPage() {
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
              <h1 className="text-3xl font-bold text-teal-900">AI Health Insights</h1>
              <p className="text-sm text-teal-700">Personalized analysis of your health patterns</p>
            </div>
            <a
              href="/dashboard"
              className="rounded-md bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700"
            >
              Back to Dashboard
            </a>
          </div>
        </header>

        <HealthInsightsAnalyzer userId={user.id} />
      </div>
    </div>
  )
}
