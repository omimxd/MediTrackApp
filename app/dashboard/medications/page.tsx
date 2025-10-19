import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { MedicationTracker } from "@/components/medication-tracker"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"

export default async function MedicationsPage({
  searchParams,
}: {
  searchParams: Promise<{ condition: string }>
}) {
  const supabase = await createClient()
  const params = await searchParams

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    redirect("/auth/login")
  }

  if (!params.condition) {
    redirect("/dashboard")
  }

  const { data: condition } = await supabase
    .from("conditions")
    .select("*")
    .eq("id", params.condition)
    .eq("user_id", user.id)
    .single()

  if (!condition) {
    redirect("/dashboard")
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
              <h1 className="text-3xl font-bold text-teal-900">Medications</h1>
              <p className="text-sm text-teal-700">Managing medications for {condition.name}</p>
            </div>
          </div>
        </header>

        <MedicationTracker userId={user.id} conditionId={params.condition} conditionName={condition.name} />
      </div>
    </div>
  )
}
