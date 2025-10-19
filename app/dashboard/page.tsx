"use client"

import { useEffect, useState } from "react"
import { generateHealthGreeting } from "@/app/actions/ai-health-actions"

export function AIGreeting({ userName }: { userName?: string }) {
  const [greeting, setGreeting] = useState("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchGreeting = async () => {
      try {
        setLoading(true)
        const text = await generateHealthGreeting(userName)
        setGreeting(text)
      } catch (error) {
        console.error("Error fetching greeting:", error)
        setGreeting("Welcome to MediTrack!")
      } finally {
        setLoading(false)
      }
    }

    fetchGreeting()
  }, [userName])

  return (
    <div className="mb-6 rounded-lg bg-gradient-to-r from-teal-500 to-blue-500 p-6 text-white shadow-lg">
      <p className="text-lg font-semibold">
        {loading ? "Loading greeting..." : greeting}
      </p>
    </div>
  )
}