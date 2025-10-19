"use client"

import { useEffect, useState } from "react"
import { generateHealthGreeting } from "@/app/actions/ai-health-actions"
import { Sparkles } from "lucide-react"

export function AIGreeting({ userName }: { userName?: string }) {
  const [greeting, setGreeting] = useState<string>("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadGreeting() {
      try {
        const message = await generateHealthGreeting(userName)
        setGreeting(message)
      } catch (error) {
        console.error("[v0] Failed to generate greeting:", error)
        setGreeting("Hey sick shyt")
      } finally {
        setLoading(false)
      }
    }

    loadGreeting()
  }, [userName])

  if (loading) {
    return (
      <div className="mb-6 rounded-lg bg-gradient-to-r from-teal-500 to-blue-500 p-6 text-white shadow-lg">
        <div className="flex items-center gap-3">
          <Sparkles className="h-6 w-6 animate-pulse" />
          <div className="h-6 w-3/4 animate-pulse rounded bg-white/20" />
        </div>
      </div>
    )
  }

  return (
    <div className="mb-6 rounded-lg bg-gradient-to-r from-teal-500 to-blue-500 p-6 text-white shadow-lg">
      <div className="flex items-start gap-3">
        <Sparkles className="mt-1 h-6 w-6 flex-shrink-0" />
        <p className="text-lg leading-relaxed">{greeting}</p>
      </div>
    </div>
  )
}
