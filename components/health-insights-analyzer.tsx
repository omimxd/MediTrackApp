"use client"

import { useEffect, useState } from "react"
import { analyzeHealthLogs } from "@/app/actions/ai-health-actions"
import { Brain, TrendingUp, AlertTriangle, CheckCircle, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

type Insight = {
  category: "pattern" | "recommendation" | "warning" | "positive"
  title: string
  description: string
  confidence: "high" | "medium" | "low"
}

type HealthInsights = {
  insights: Insight[]
  summary: string
}

export function HealthInsightsAnalyzer({ userId }: { userId: string }) {
  const [insights, setInsights] = useState<HealthInsights | null>(null)
  const [loading, setLoading] = useState(false)

  async function analyzeHealth() {
    setLoading(true)
    try {
      const result = await analyzeHealthLogs(userId)
      setInsights(result)
    } catch (error) {
      console.error("[v0] Failed to analyze health logs:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    analyzeHealth()
  }, [userId])

  const getInsightIcon = (category: string) => {
    switch (category) {
      case "pattern":
        return <TrendingUp className="h-5 w-5 text-blue-600" />
      case "recommendation":
        return <Brain className="h-5 w-5 text-purple-600" />
      case "warning":
        return <AlertTriangle className="h-5 w-5 text-amber-600" />
      case "positive":
        return <CheckCircle className="h-5 w-5 text-green-600" />
      default:
        return <Brain className="h-5 w-5 text-gray-600" />
    }
  }

  const getConfidenceBadge = (confidence: string) => {
    const colors = {
      high: "bg-green-100 text-green-800",
      medium: "bg-yellow-100 text-yellow-800",
      low: "bg-gray-100 text-gray-800",
    }
    return (
      <span className={`rounded-full px-2 py-1 text-xs font-medium ${colors[confidence as keyof typeof colors]}`}>
        {confidence} confidence
      </span>
    )
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="mb-4 h-12 w-12 animate-spin text-teal-600" />
        <p className="text-teal-700">Analyzing your health patterns...</p>
      </div>
    )
  }

  if (!insights) {
    return (
      <Card className="p-8 text-center">
        <Brain className="mx-auto mb-4 h-12 w-12 text-gray-400" />
        <p className="mb-4 text-gray-600">No insights available yet.</p>
        <Button onClick={analyzeHealth}>Analyze Health Logs</Button>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <Card className="bg-gradient-to-r from-teal-500 to-blue-500 p-6 text-white">
        <div className="flex items-start gap-3">
          <Brain className="mt-1 h-6 w-6 flex-shrink-0" />
          <div>
            <h2 className="mb-2 text-xl font-semibold">AI Analysis Summary</h2>
            <p className="leading-relaxed">{insights.summary}</p>
          </div>
        </div>
      </Card>

      {/* Insights Grid */}
      <div className="grid gap-4 md:grid-cols-2">
        {insights.insights.map((insight, index) => (
          <Card key={index} className="p-6">
            <div className="mb-3 flex items-start justify-between">
              <div className="flex items-center gap-2">
                {getInsightIcon(insight.category)}
                <h3 className="font-semibold text-gray-900">{insight.title}</h3>
              </div>
              {getConfidenceBadge(insight.confidence)}
            </div>
            <p className="text-sm leading-relaxed text-gray-600">{insight.description}</p>
          </Card>
        ))}
      </div>

      {/* Refresh Button */}
      <div className="flex justify-center">
        <Button onClick={analyzeHealth} disabled={loading} variant="outline">
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <Brain className="mr-2 h-4 w-4" />
              Refresh Analysis
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
