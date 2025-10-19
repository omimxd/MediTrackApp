"use client"

import { useState, useEffect } from "react"
import { checkDrugInteractions } from "@/app/actions/ai-health-actions"
import { createClient } from "@/lib/supabase/client"
import { AlertTriangle, CheckCircle, Loader2, Pill, Shield } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"

type DrugInteraction = {
  hasInteractions: boolean
  interactions: Array<{
    medications: string[]
    severity: "severe" | "moderate" | "mild"
    description: string
    recommendation: string
  }>
  summary: string
}

type Medication = {
  id: string
  name: string
  dosage: string
  condition_id: string
}

export function DrugInteractionChecker({ userId }: { userId: string }) {
  const [medications, setMedications] = useState<Medication[]>([])
  const [selectedMeds, setSelectedMeds] = useState<string[]>([])
  const [analysis, setAnalysis] = useState<DrugInteraction | null>(null)
  const [loading, setLoading] = useState(false)
  const [loadingMeds, setLoadingMeds] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    loadMedications()
  }, [userId])

  async function loadMedications() {
    setLoadingMeds(true)
    const { data: conditions } = await supabase.from("conditions").select("*, medications(*)").eq("user_id", userId)

    const allMeds = conditions?.flatMap((c) => c.medications || []) || []
    setMedications(allMeds)
    setLoadingMeds(false)
  }

  async function checkInteractions() {
    if (selectedMeds.length < 2) return

    setLoading(true)
    try {
      const result = await checkDrugInteractions(selectedMeds)
      setAnalysis(result)
    } catch (error) {
      console.error("[v0] Failed to check drug interactions:", error)
    } finally {
      setLoading(false)
    }
  }

  const toggleMedication = (medName: string) => {
    setSelectedMeds((prev) => (prev.includes(medName) ? prev.filter((m) => m !== medName) : [...prev, medName]))
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "severe":
        return "border-red-300 bg-red-50"
      case "moderate":
        return "border-orange-300 bg-orange-50"
      case "mild":
        return "border-yellow-300 bg-yellow-50"
      default:
        return "border-gray-300 bg-gray-50"
    }
  }

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "severe":
        return <AlertTriangle className="h-5 w-5 text-red-600" />
      case "moderate":
        return <AlertTriangle className="h-5 w-5 text-orange-600" />
      case "mild":
        return <AlertTriangle className="h-5 w-5 text-yellow-600" />
      default:
        return <AlertTriangle className="h-5 w-5 text-gray-600" />
    }
  }

  if (loadingMeds) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="mb-4 h-12 w-12 animate-spin text-teal-600" />
        <p className="text-teal-700">Loading medications...</p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Medication Selection */}
      <Card className="p-6">
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Select Medications to Check</h2>
          <p className="text-sm text-muted-foreground">Choose at least 2 medications to check for interactions</p>
        </div>

        {medications.length === 0 ? (
          <div className="py-8 text-center">
            <Pill className="mx-auto mb-2 h-12 w-12 text-gray-400" />
            <p className="text-sm text-muted-foreground">No medications found. Add medications first.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {medications.map((med) => (
              <div key={med.id} className="flex items-center space-x-3 rounded-lg border p-3">
                <Checkbox
                  id={med.id}
                  checked={selectedMeds.includes(med.name)}
                  onCheckedChange={() => toggleMedication(med.name)}
                />
                <Label htmlFor={med.id} className="flex-1 cursor-pointer">
                  <span className="font-medium">{med.name}</span>
                  <span className="ml-2 text-sm text-muted-foreground">({med.dosage})</span>
                </Label>
              </div>
            ))}
          </div>
        )}

        <div className="mt-4 flex items-center justify-between">
          <p className="text-sm text-muted-foreground">{selectedMeds.length} medication(s) selected</p>
          <Button
            onClick={checkInteractions}
            disabled={loading || selectedMeds.length < 2}
            className="bg-teal-600 hover:bg-teal-700"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Checking...
              </>
            ) : (
              <>
                <Shield className="mr-2 h-4 w-4" />
                Check Interactions
              </>
            )}
          </Button>
        </div>
      </Card>

      {/* Analysis Results */}
      {analysis && (
        <div className="space-y-6">
          {/* Summary */}
          <Card
            className={`p-6 ${
              analysis.hasInteractions ? "border-amber-300 bg-amber-50" : "border-green-300 bg-green-50"
            }`}
          >
            <div className="flex items-start gap-3">
              {analysis.hasInteractions ? (
                <AlertTriangle className="mt-1 h-6 w-6 flex-shrink-0 text-amber-600" />
              ) : (
                <CheckCircle className="mt-1 h-6 w-6 flex-shrink-0 text-green-600" />
              )}
              <div>
                <h3 className="mb-2 text-lg font-semibold">
                  {analysis.hasInteractions ? "Interactions Found" : "No Interactions Found"}
                </h3>
                <p className="leading-relaxed">{analysis.summary}</p>
              </div>
            </div>
          </Card>

          {/* Interaction Details */}
          {analysis.hasInteractions && analysis.interactions.length > 0 && (
            <div>
              <h3 className="mb-4 text-xl font-semibold text-gray-900">Interaction Details</h3>
              <div className="space-y-4">
                {analysis.interactions.map((interaction, index) => (
                  <Card key={index} className={`border-2 p-6 ${getSeverityColor(interaction.severity)}`}>
                    <div className="mb-3 flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        {getSeverityIcon(interaction.severity)}
                        <h4 className="font-semibold capitalize">{interaction.severity} Interaction</h4>
                      </div>
                    </div>
                    <div className="mb-3">
                      <p className="text-sm font-medium text-gray-700">Medications:</p>
                      <p className="text-sm text-gray-900">{interaction.medications.join(" + ")}</p>
                    </div>
                    <div className="mb-3">
                      <p className="text-sm font-medium text-gray-700">Description:</p>
                      <p className="text-sm text-gray-900">{interaction.description}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-700">Recommendation:</p>
                      <p className="text-sm text-gray-900">{interaction.recommendation}</p>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
