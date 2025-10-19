"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Plus, Trash2, ArrowUpDown, FileText, Bell, Brain, Stethoscope, Shield, BarChart3 } from "lucide-react"
import { useRouter } from "next/navigation"
import Link from "next/link"

interface Condition {
  id: string
  name: string
  user_id: string
  created_at: string
}

export function ConditionsManager({ userId }: { userId: string }) {
  const [conditions, setConditions] = useState<Condition[]>([])
  const [newConditionName, setNewConditionName] = useState("")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedCondition, setSelectedCondition] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    loadConditions()
  }, [])

  const loadConditions = async () => {
    setIsLoading(true)
    const { data, error } = await supabase
      .from("conditions")
      .select("*")
      .eq("user_id", userId)
      .order("name", { ascending: true })

    if (error) {
      console.error("Error loading conditions:", error)
    } else {
      setConditions(data || [])
    }
    setIsLoading(false)
  }

  const addCondition = async () => {
    if (!newConditionName.trim()) return

    const { error } = await supabase.from("conditions").insert({
      name: newConditionName,
      user_id: userId,
    })

    if (error) {
      console.error("Error adding condition:", error)
    } else {
      setNewConditionName("")
      setIsAddDialogOpen(false)
      loadConditions()
    }
  }

  const deleteCondition = async (id: string) => {
    const { error } = await supabase.from("conditions").delete().eq("id", id)

    if (error) {
      console.error("Error deleting condition:", error)
    } else {
      if (selectedCondition === id) {
        setSelectedCondition(null)
      }
      loadConditions()
    }
  }

  const sortConditions = () => {
    const sorted = [...conditions].sort((a, b) => a.name.localeCompare(b.name))
    setConditions(sorted)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-teal-700">Loading conditions...</p>
      </div>
    )
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card className="border-teal-100">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-teal-900">Medical Conditions</CardTitle>
              <CardDescription>Manage your health conditions</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="icon" onClick={sortConditions} title="Sort A-Z">
                <ArrowUpDown className="h-4 w-4" />
              </Button>
              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="icon" className="bg-teal-600 hover:bg-teal-700">
                    <Plus className="h-4 w-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New Condition</DialogTitle>
                    <DialogDescription>Enter the name of the medical condition</DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="condition-name">Condition Name</Label>
                      <Input
                        id="condition-name"
                        placeholder="e.g., Diabetes, Hypertension"
                        value={newConditionName}
                        onChange={(e) => setNewConditionName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            addCondition()
                          }
                        }}
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={addCondition} className="bg-teal-600 hover:bg-teal-700">
                      Add Condition
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {conditions.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-sm text-muted-foreground">No conditions added yet</p>
              <p className="text-xs text-muted-foreground">Click the + button to add your first condition</p>
            </div>
          ) : (
            <div className="space-y-2">
              {conditions.map((condition) => (
                <div
                  key={condition.id}
                  className={`flex items-center justify-between rounded-lg border p-3 transition-colors ${
                    selectedCondition === condition.id
                      ? "border-teal-500 bg-teal-50"
                      : "border-gray-200 hover:border-teal-300 hover:bg-teal-50/50"
                  }`}
                  onClick={() => setSelectedCondition(condition.id)}
                  role="button"
                  tabIndex={0}
                >
                  <span className="font-medium text-teal-900">{condition.name}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation()
                      deleteCondition(condition.id)
                    }}
                    className="text-red-500 hover:bg-red-50 hover:text-red-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-teal-100">
        <CardHeader>
          <CardTitle className="text-teal-900">Quick Actions</CardTitle>
          <CardDescription>
            {selectedCondition ? "Manage medications or view health logs" : "Select a condition or view health logs"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {selectedCondition && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Selected:{" "}
                <span className="font-medium text-teal-900">
                  {conditions.find((c) => c.id === selectedCondition)?.name}
                </span>
              </p>
              <Button
                onClick={() => router.push(`/dashboard/medications?condition=${selectedCondition}`)}
                className="w-full bg-teal-600 hover:bg-teal-700"
              >
                Manage Medications
              </Button>
            </div>
          )}
          <Button
            asChild
            variant="outline"
            className="w-full border-indigo-200 bg-gradient-to-r from-indigo-50 to-purple-50 text-indigo-700 hover:from-indigo-100 hover:to-purple-100"
          >
            <Link href="/dashboard/health-summary">
              <BarChart3 className="mr-2 h-4 w-4" />
              Health Summary Reports
            </Link>
          </Button>
          <Button
            asChild
            variant="outline"
            className="w-full border-red-200 bg-gradient-to-r from-red-50 to-orange-50 text-red-700 hover:from-red-100 hover:to-orange-100"
          >
            <Link href="/dashboard/drug-interactions">
              <Shield className="mr-2 h-4 w-4" />
              Drug Interaction Checker
            </Link>
          </Button>
          <Button
            asChild
            variant="outline"
            className="w-full border-pink-200 bg-gradient-to-r from-pink-50 to-purple-50 text-pink-700 hover:from-pink-100 hover:to-purple-100"
          >
            <Link href="/dashboard/symptom-checker">
              <Stethoscope className="mr-2 h-4 w-4" />
              AI Symptom Checker
            </Link>
          </Button>
          <Button
            asChild
            variant="outline"
            className="w-full border-purple-200 bg-gradient-to-r from-purple-50 to-blue-50 text-purple-700 hover:from-purple-100 hover:to-blue-100"
          >
            <Link href="/dashboard/insights">
              <Brain className="mr-2 h-4 w-4" />
              AI Health Insights
            </Link>
          </Button>
          <Button
            asChild
            variant="outline"
            className="w-full border-teal-200 text-teal-700 hover:bg-teal-50 bg-transparent"
          >
            <Link href="/dashboard/reminders">
              <Bell className="mr-2 h-4 w-4" />
              View Reminders
            </Link>
          </Button>
          <Button
            asChild
            variant="outline"
            className="w-full border-teal-200 text-teal-700 hover:bg-teal-50 bg-transparent"
          >
            <Link href="/dashboard/health-logs">
              <FileText className="mr-2 h-4 w-4" />
              View Health Logs
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
