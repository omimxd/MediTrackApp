"use server"

import { generateText, generateObject } from "ai"
import { google } from "@ai-sdk/google"
import { z } from "zod"
import { createServerClient } from "@/lib/supabase/server"

// AI Greeting with jokes for sick users
export async function generateHealthGreeting(userName?: string) {
  const { text } = await generateText({
    model: google("gemini-2.0-flash"),
    prompt: `Generate a short, cheerful, slightly humorous greeting for someone who is managing their health and medications. 
    ${userName ? `Their name is ${userName}.` : ""} 
    Include a light joke or pun about staying healthy (like "Hey sick shyt" but more appropriate and uplifting). 
    Keep it under 50 words and make it encouraging.`,
    maxOutputTokens: 100,
  })

  return text
}

// Health Insights Analyzer
const healthInsightSchema = z.object({
  insights: z.array(
    z.object({
      category: z.enum(["pattern", "recommendation", "warning", "positive"]),
      title: z.string(),
      description: z.string(),
      confidence: z.enum(["high", "medium", "low"]),
    }),
  ),
  summary: z.string(),
})

export async function analyzeHealthLogs(userId: string) {
  const supabase = await createServerClient()

  // Fetch recent health logs
  const { data: logs } = await supabase
    .from("health_logs")
    .select("*")
    .eq("user_id", userId)
    .order("date", { ascending: false })
    .limit(30)

  if (!logs || logs.length === 0) {
    return {
      insights: [],
      summary: "Not enough health data to analyze. Start logging your health to get personalized insights!",
    }
  }

  const logsText = logs.map((log) => `${log.date}: ${log.notes}`).join("\n")

  const { object } = await generateObject({
    model: google("gemini-2.0-flash"),
    schema: healthInsightSchema,
    prompt: `Analyze these health logs and provide personalized insights:

${logsText}

Look for:
- Patterns (e.g., "consistent fatigue on Mondays")
- Recommendations for lifestyle changes
- When to see a doctor
- Positive trends

Provide 2-4 actionable insights.`,
  })

  return object
}

// Symptom Checker
const symptomAnalysisSchema = z.object({
  possibleConditions: z.array(
    z.object({
      name: z.string(),
      likelihood: z.enum(["high", "medium", "low"]),
      description: z.string(),
    }),
  ),
  urgency: z.enum(["emergency", "urgent", "routine", "monitor"]),
  recommendations: z.array(z.string()),
  disclaimer: z.string(),
})

export async function analyzeSymptoms(symptoms: string) {
  const { object } = await generateObject({
    model: google("gemini-2.0-flash"),
    schema: symptomAnalysisSchema,
    prompt: `Analyze these symptoms and provide possible conditions: "${symptoms}"

Provide:
1. 2-4 possible conditions with likelihood
2. Urgency level (emergency, urgent, routine, monitor)
3. Recommendations (when to see doctor, self-care tips)
4. Medical disclaimer

Be cautious and err on the side of recommending professional medical advice.`,
  })

  return object
}

// Drug Interaction Checker
const drugInteractionSchema = z.object({
  hasInteractions: z.boolean(),
  interactions: z.array(
    z.object({
      medications: z.array(z.string()),
      severity: z.enum(["severe", "moderate", "mild"]),
      description: z.string(),
      recommendation: z.string(),
    }),
  ),
  summary: z.string(),
})

export async function checkDrugInteractions(medications: string[]) {
  if (medications.length < 2) {
    return {
      hasInteractions: false,
      interactions: [],
      summary: "Need at least 2 medications to check for interactions.",
    }
  }

  const { object } = await generateObject({
    model: google("gemini-2.0-flash"),
    schema: drugInteractionSchema,
    prompt: `Check for drug interactions between these medications: ${medications.join(", ")}

Analyze:
1. Known interactions between these drugs
2. Severity level (severe, moderate, mild)
3. What happens when combined
4. Recommendations (timing, alternatives, doctor consultation)

Be thorough and cautious. Include a disclaimer to consult a healthcare provider.`,
  })

  return object
}

// Missed Medication Advisor
const missedMedicationSchema = z.object({
  canTakeNow: z.boolean(),
  recommendation: z.string(),
  reasoning: z.string(),
  nextSteps: z.array(z.string()),
  urgency: z.enum(["critical", "important", "routine"]),
})

export async function adviseMissedMedication(
  medicationName: string,
  dosage: string,
  scheduledTime: string,
  currentTime: string,
  nextScheduledTime?: string,
) {
  const { object } = await generateObject({
    model: google("gemini-2.0-flash"),
    schema: missedMedicationSchema,
    prompt: `A patient missed their medication dose:
- Medication: ${medicationName}
- Dosage: ${dosage}
- Scheduled time: ${scheduledTime}
- Current time: ${currentTime}
${nextScheduledTime ? `- Next scheduled dose: ${nextScheduledTime}` : ""}

Advise:
1. Can they take it now?
2. What should they do?
3. Should they contact their doctor?
4. Any risks or considerations?

Be cautious and recommend consulting healthcare provider when uncertain.`,
  })

  return object
}

// Health Summary Report
const healthSummarySchema = z.object({
  period: z.string(),
  overallHealth: z.enum(["excellent", "good", "fair", "concerning"]),
  keyMetrics: z.object({
    totalLogs: z.number(),
    medicationAdherence: z.string(),
    commonSymptoms: z.array(z.string()),
  }),
  trends: z.array(
    z.object({
      category: z.string(),
      trend: z.enum(["improving", "stable", "declining"]),
      description: z.string(),
    }),
  ),
  recommendations: z.array(z.string()),
  summary: z.string(),
})

export async function generateHealthSummary(userId: string, period: "week" | "month") {
  const supabase = await createServerClient()

  const daysAgo = period === "week" ? 7 : 30
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - daysAgo)

  // Fetch health logs
  const { data: logs } = await supabase
    .from("health_logs")
    .select("*")
    .eq("user_id", userId)
    .gte("date", startDate.toISOString().split("T")[0])
    .order("date", { ascending: false })

  // Fetch medications
  const { data: conditions } = await supabase.from("conditions").select("*, medications(*)").eq("user_id", userId)

  const logsText = logs?.map((log) => `${log.date}: ${log.notes}`).join("\n") || "No logs"
  const medsText =
    conditions?.flatMap((c) => c.medications?.map((m: any) => `${m.name} (${m.dosage})`) || []).join(", ") ||
    "No medications"

  const { object } = await generateObject({
    model: google("gemini-2.0-flash"),
    schema: healthSummarySchema,
    prompt: `Generate a ${period}ly health summary report:

Health Logs (${logs?.length || 0} entries):
${logsText}

Current Medications:
${medsText}

Provide:
1. Overall health assessment
2. Key metrics (log count, adherence estimate, common symptoms)
3. Trends (improving/stable/declining)
4. Personalized recommendations
5. Executive summary

Be encouraging and actionable.`,
  })

  return object
}