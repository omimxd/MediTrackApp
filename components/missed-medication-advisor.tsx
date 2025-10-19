"use client"

import { useState, useEffect } from "react"
import { adviseMissedMedication } from "@/app/actions/ai-health-actions"
import { AlertCircle, Loader2, CheckCircle2, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"

type MissedMedicationAdvice = {
  canTakeNow: boolean
  recommendation: string
  reasoning: string
  nextSteps: string[]
  urgency: "critical" | "important" | "routine"
}

interface MissedMedicationAdvisorProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  medicationName: string
  dosage: string
  scheduledTime: string
  nextScheduledTime?: string
  onMarkTaken: () => void
}

export function MissedMedicationAdvisor({
  open,
  onOpenChange,
  medicationName,
  dosage,
  scheduledTime,
  nextScheduledTime,
  onMarkTaken,
}: MissedMedicationAdvisorProps) {
  const [advice, setAdvice] = useState<MissedMedicationAdvice | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (open) {
      getAdvice()
    }
  }, [open])

  async function getAdvice() {
    setLoading(true)
    try {
      const now = new Date()
      const currentTimeStr = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`

      const result = await adviseMissedMedication(
        medicationName,
        dosage,
        scheduledTime,
        currentTimeStr,
        nextScheduledTime,
      )
      setAdvice(result)
    } catch (error) {
      console.error("[v0] Failed to get missed medication advice:", error)
    } finally {
      setLoading(false)
    }
  }

  const formatTime = (time: string): string => {
    const [hours, minutes] = time.split(":")
    const hour = Number.parseInt(hours)
    const ampm = hour >= 12 ? "PM" : "AM"
    const displayHour = hour % 12 || 12
    return `${displayHour}:${minutes} ${ampm}`
  }

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case "critical":
        return "bg-red-100 text-red-800 border-red-300"
      case "important":
        return "bg-orange-100 text-orange-800 border-orange-300"
      case "routine":
        return "bg-blue-100 text-blue-800 border-blue-300"
      default:
        return "bg-gray-100 text-gray-800 border-gray-300"
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-amber-600" />
            Missed Medication Advice
          </DialogTitle>
          <DialogDescription>AI-powered guidance for your missed dose of {medicationName}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Medication Info */}
          <div className="rounded-lg border bg-gray-50 p-4">
            <div className="grid gap-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Medication:</span>
                <span className="font-medium">{medicationName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Dosage:</span>
                <span className="font-medium">{dosage}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Scheduled Time:</span>
                <span className="font-medium">{formatTime(scheduledTime)}</span>
              </div>
              {nextScheduledTime && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Next Dose:</span>
                  <span className="font-medium">{formatTime(nextScheduledTime)}</span>
                </div>
              )}
            </div>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-8">
              <Loader2 className="mb-4 h-12 w-12 animate-spin text-teal-600" />
              <p className="text-sm text-muted-foreground">Analyzing your situation...</p>
            </div>
          ) : advice ? (
            <div className="space-y-4">
              {/* Urgency Badge */}
              <div className={`rounded-lg border-2 p-4 ${getUrgencyColor(advice.urgency)}`}>
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  <span className="font-semibold uppercase">{advice.urgency} Priority</span>
                </div>
              </div>

              {/* Can Take Now */}
              <div
                className={`rounded-lg border-2 p-4 ${advice.canTakeNow ? "border-green-300 bg-green-50" : "border-red-300 bg-red-50"}`}
              >
                <div className="flex items-start gap-3">
                  {advice.canTakeNow ? (
                    <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-green-600" />
                  ) : (
                    <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-600" />
                  )}
                  <div>
                    <p className="font-semibold">{advice.canTakeNow ? "You can take it now" : "Do not take it now"}</p>
                    <p className="mt-1 text-sm">{advice.recommendation}</p>
                  </div>
                </div>
              </div>

              {/* Reasoning */}
              <div className="rounded-lg border bg-blue-50 p-4">
                <h4 className="mb-2 font-semibold text-blue-900">Why?</h4>
                <p className="text-sm text-blue-800">{advice.reasoning}</p>
              </div>

              {/* Next Steps */}
              <div className="rounded-lg border bg-gray-50 p-4">
                <h4 className="mb-3 font-semibold text-gray-900">What to do next:</h4>
                <ul className="space-y-2">
                  {advice.nextSteps.map((step, index) => (
                    <li key={index} className="flex gap-2 text-sm text-gray-700">
                      <span className="text-teal-600">•</span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                {advice.canTakeNow && (
                  <Button onClick={onMarkTaken} className="flex-1 bg-teal-600 hover:bg-teal-700">
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Mark as Taken Now
                  </Button>
                )}
                <Button onClick={() => onOpenChange(false)} variant="outline" className="flex-1">
                  Close
                </Button>
              </div>

              {/* Disclaimer */}
              <p className="text-xs text-muted-foreground">
                This is AI-generated advice for informational purposes only. Always consult your healthcare provider for
                medical decisions.
              </p>
            </div>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  )
}
