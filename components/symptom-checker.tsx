"use client"

import { useState } from "react"
import { analyzeSymptoms } from "@/app/actions/ai-health-actions"
import { Stethoscope, AlertCircle, Loader2, Info } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"

type SymptomAnalysis = {
  possibleConditions: Array<{
    name: string
    likelihood: "high" | "medium" | "low"
    description: string
  }>
  urgency: "emergency" | "urgent" | "routine" | "monitor"
  recommendations: string[]
  disclaimer: string
}

export function SymptomChecker() {
  const [symptoms, setSymptoms] = useState("")
  const [analysis, setAnalysis] = useState<SymptomAnalysis | null>(null)
  const [loading, setLoading] = useState(false)

  async function checkSymptoms() {
    if (!symptoms.trim()) return

    setLoading(true)
    try {
      const result = await analyzeSymptoms(symptoms)
      setAnalysis(result)
    } catch (error) {
      console.error("[v0] Failed to analyze symptoms:", error)
    } finally {
      setLoading(false)
    }
  }

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case "emergency":
        return "bg-red-100 text-red-800 border-red-300"
      case "urgent":
        return "bg-orange-100 text-orange-800 border-orange-300"
      case "routine":
        return "bg-blue-100 text-blue-800 border-blue-300"
      case "monitor":
        return "bg-green-100 text-green-800 border-green-300"
      default:
        return "bg-gray-100 text-gray-800 border-gray-300"
    }
  }

  const getLikelihoodBadge = (likelihood: string) => {
    const colors = {
      high: "bg-red-100 text-red-800",
      medium: "bg-yellow-100 text-yellow-800",
      low: "bg-green-100 text-green-800",
    }
    return (
      <span className={`rounded-full px-2 py-1 text-xs font-medium ${colors[likelihood as keyof typeof colors]}`}>
        {likelihood} likelihood
      </span>
    )
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Input Card */}
      <Card className="p-6">
        <div className="space-y-4">
          <div>
            <Label htmlFor="symptoms" className="text-base font-semibold">
              Describe Your Symptoms
            </Label>
            <p className="text-sm text-muted-foreground">
              Be as detailed as possible. Include when symptoms started, severity, and any other relevant information.
            </p>
          </div>
          <Textarea
            id="symptoms"
            placeholder="e.g., I have a headache and fever that started yesterday. The headache is moderate and the fever is around 100°F..."
            value={symptoms}
            onChange={(e) => setSymptoms(e.target.value)}
            rows={6}
            className="resize-none"
          />
          <Button
            onClick={checkSymptoms}
            disabled={loading || !symptoms.trim()}
            className="w-full bg-teal-600 hover:bg-teal-700"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Analyzing Symptoms...
              </>
            ) : (
              <>
                <Stethoscope className="mr-2 h-4 w-4" />
                Analyze Symptoms
              </>
            )}
          </Button>
        </div>
      </Card>

      {/* Disclaimer */}
      <Card className="border-amber-200 bg-amber-50 p-4">
        <div className="flex gap-3">
          <Info className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-600" />
          <div className="text-sm text-amber-900">
            <p className="font-semibold">Medical Disclaimer</p>
            <p>
              This AI symptom checker is for informational purposes only and does not replace professional medical
              advice. Always consult a healthcare provider for medical concerns.
            </p>
          </div>
        </div>
      </Card>

      {/* Analysis Results */}
      {analysis && (
        <div className="space-y-6">
          {/* Urgency Level */}
          <Card className={`border-2 p-6 ${getUrgencyColor(analysis.urgency)}`}>
            <div className="flex items-start gap-3">
              <AlertCircle className="mt-1 h-6 w-6 flex-shrink-0" />
              <div>
                <h3 className="mb-1 text-lg font-semibold">Urgency Level: {analysis.urgency.toUpperCase()}</h3>
                <p className="text-sm">
                  {analysis.urgency === "emergency" &&
                    "Seek immediate medical attention. Call emergency services or go to the nearest emergency room."}
                  {analysis.urgency === "urgent" && "Schedule an appointment with your doctor as soon as possible."}
                  {analysis.urgency === "routine" && "Consider scheduling a routine appointment with your doctor."}
                  {analysis.urgency === "monitor" && "Monitor your symptoms. Seek care if they worsen or persist."}
                </p>
              </div>
            </div>
          </Card>

          {/* Possible Conditions */}
          <div>
            <h3 className="mb-4 text-xl font-semibold text-gray-900">Possible Conditions</h3>
            <div className="space-y-3">
              {analysis.possibleConditions.map((condition, index) => (
                <Card key={index} className="p-4">
                  <div className="mb-2 flex items-start justify-between">
                    <h4 className="font-semibold text-gray-900">{condition.name}</h4>
                    {getLikelihoodBadge(condition.likelihood)}
                  </div>
                  <p className="text-sm text-gray-600">{condition.description}</p>
                </Card>
              ))}
            </div>
          </div>

          {/* Recommendations */}
          <div>
            <h3 className="mb-4 text-xl font-semibold text-gray-900">Recommendations</h3>
            <Card className="p-4">
              <ul className="space-y-2">
                {analysis.recommendations.map((rec, index) => (
                  <li key={index} className="flex gap-2 text-sm text-gray-700">
                    <span className="text-teal-600">•</span>
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </Card>
          </div>

          {/* AI Disclaimer */}
          <Card className="border-gray-300 bg-gray-50 p-4">
            <p className="text-xs text-gray-600">{analysis.disclaimer}</p>
          </Card>
        </div>
      )}
    </div>
  )
}
