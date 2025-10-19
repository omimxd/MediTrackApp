"use client"

import { useState } from "react"
import { generateHealthSummary } from "@/app/actions/ai-health-actions"
import { FileText, TrendingUp, TrendingDown, Minus, Loader2, Calendar } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"

type HealthSummary = {
  period: string
  overallHealth: "excellent" | "good" | "fair" | "concerning"
  keyMetrics: {
    totalLogs: number
    medicationAdherence: string
    commonSymptoms: string[]
  }
  trends: Array<{
    category: string
    trend: "improving" | "stable" | "declining"
    description: string
  }>
  recommendations: string[]
  summary: string
}

export function HealthSummaryReports({ userId }: { userId: string }) {
  const [weeklySummary, setWeeklySummary] = useState<HealthSummary | null>(null)
  const [monthlySummary, setMonthlySummary] = useState<HealthSummary | null>(null)
  const [loadingWeekly, setLoadingWeekly] = useState(false)
  const [loadingMonthly, setLoadingMonthly] = useState(false)

  async function generateWeeklySummary() {
    setLoadingWeekly(true)
    try {
      const result = await generateHealthSummary(userId, "week")
      setWeeklySummary(result)
    } catch (error) {
      console.error("[v0] Failed to generate weekly summary:", error)
    } finally {
      setLoadingWeekly(false)
    }
  }

  async function generateMonthlySummary() {
    setLoadingMonthly(true)
    try {
      const result = await generateHealthSummary(userId, "month")
      setMonthlySummary(result)
    } catch (error) {
      console.error("[v0] Failed to generate monthly summary:", error)
    } finally {
      setLoadingMonthly(false)
    }
  }

  const getHealthColor = (health: string) => {
    switch (health) {
      case "excellent":
        return "bg-green-100 text-green-800 border-green-300"
      case "good":
        return "bg-blue-100 text-blue-800 border-blue-300"
      case "fair":
        return "bg-yellow-100 text-yellow-800 border-yellow-300"
      case "concerning":
        return "bg-red-100 text-red-800 border-red-300"
      default:
        return "bg-gray-100 text-gray-800 border-gray-300"
    }
  }

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case "improving":
        return <TrendingUp className="h-5 w-5 text-green-600" />
      case "declining":
        return <TrendingDown className="h-5 w-5 text-red-600" />
      case "stable":
        return <Minus className="h-5 w-5 text-blue-600" />
      default:
        return <Minus className="h-5 w-5 text-gray-600" />
    }
  }

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case "improving":
        return "border-green-200 bg-green-50"
      case "declining":
        return "border-red-200 bg-red-50"
      case "stable":
        return "border-blue-200 bg-blue-50"
      default:
        return "border-gray-200 bg-gray-50"
    }
  }

  const renderSummary = (summary: HealthSummary | null, loading: boolean, onGenerate: () => void) => {
    if (loading) {
      return (
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className="mb-4 h-12 w-12 animate-spin text-teal-600" />
          <p className="text-teal-700">Generating your health summary...</p>
        </div>
      )
    }

    if (!summary) {
      return (
        <Card className="p-8 text-center">
          <FileText className="mx-auto mb-4 h-12 w-12 text-gray-400" />
          <p className="mb-4 text-gray-600">No summary generated yet.</p>
          <Button onClick={onGenerate} className="bg-teal-600 hover:bg-teal-700">
            <Calendar className="mr-2 h-4 w-4" />
            Generate Summary
          </Button>
        </Card>
      )
    }

    return (
      <div className="space-y-6">
        {/* Overall Health */}
        <Card className={`border-2 p-6 ${getHealthColor(summary.overallHealth)}`}>
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-lg font-semibold">Overall Health Status</h3>
            <Badge variant="secondary" className="capitalize">
              {summary.overallHealth}
            </Badge>
          </div>
          <p className="leading-relaxed">{summary.summary}</p>
        </Card>

        {/* Key Metrics */}
        <Card className="p-6">
          <h3 className="mb-4 text-lg font-semibold text-gray-900">Key Metrics</h3>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-lg border bg-teal-50 p-4">
              <p className="text-sm text-muted-foreground">Health Logs</p>
              <p className="text-2xl font-bold text-teal-900">{summary.keyMetrics.totalLogs}</p>
            </div>
            <div className="rounded-lg border bg-blue-50 p-4">
              <p className="text-sm text-muted-foreground">Medication Adherence</p>
              <p className="text-2xl font-bold text-blue-900">{summary.keyMetrics.medicationAdherence}</p>
            </div>
            <div className="rounded-lg border bg-purple-50 p-4">
              <p className="text-sm text-muted-foreground">Common Symptoms</p>
              <p className="text-sm font-medium text-purple-900">
                {summary.keyMetrics.commonSymptoms.length > 0
                  ? summary.keyMetrics.commonSymptoms.join(", ")
                  : "None reported"}
              </p>
            </div>
          </div>
        </Card>

        {/* Trends */}
        <div>
          <h3 className="mb-4 text-lg font-semibold text-gray-900">Health Trends</h3>
          <div className="grid gap-4 md:grid-cols-2">
            {summary.trends.map((trend, index) => (
              <Card key={index} className={`border-2 p-4 ${getTrendColor(trend.trend)}`}>
                <div className="mb-2 flex items-center gap-2">
                  {getTrendIcon(trend.trend)}
                  <h4 className="font-semibold capitalize">{trend.category}</h4>
                </div>
                <p className="text-sm text-gray-700">{trend.description}</p>
              </Card>
            ))}
          </div>
        </div>

        {/* Recommendations */}
        <Card className="p-6">
          <h3 className="mb-4 text-lg font-semibold text-gray-900">Personalized Recommendations</h3>
          <ul className="space-y-3">
            {summary.recommendations.map((rec, index) => (
              <li key={index} className="flex gap-3 rounded-lg border bg-gray-50 p-3">
                <span className="text-teal-600">•</span>
                <span className="text-sm text-gray-700">{rec}</span>
              </li>
            ))}
          </ul>
        </Card>

        {/* Regenerate Button */}
        <div className="flex justify-center">
          <Button onClick={onGenerate} variant="outline" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <FileText className="mr-2 h-4 w-4" />
                Regenerate Summary
              </>
            )}
          </Button>
        </div>
      </div>
    )
  }

  return (
    <Tabs defaultValue="weekly" className="w-full">
      <TabsList className="grid w-full max-w-md grid-cols-2">
        <TabsTrigger value="weekly">Weekly Summary</TabsTrigger>
        <TabsTrigger value="monthly">Monthly Summary</TabsTrigger>
      </TabsList>

      <TabsContent value="weekly" className="mt-6">
        {renderSummary(weeklySummary, loadingWeekly, generateWeeklySummary)}
      </TabsContent>

      <TabsContent value="monthly" className="mt-6">
        {renderSummary(monthlySummary, loadingMonthly, generateMonthlySummary)}
      </TabsContent>
    </Tabs>
  )
}
