"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Bell, BellRing, Clock, Pill, CheckCircle2, HelpCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { MissedMedicationAdvisor } from "@/components/missed-medication-advisor"

interface Medication {
  id: string
  condition_id: string
  name: string
  dosage: string
  times_per_day: number
  reminder_times: string[]
  expiry_date: string
  user_id: string
  created_at: string
}

interface Condition {
  id: string
  name: string
}

interface ReminderItem {
  medication: Medication
  condition: Condition
  time: string
  isPast: boolean
  isUpcoming: boolean
}

export function ReminderDashboard({ userId }: { userId: string }) {
  const [reminders, setReminders] = useState<ReminderItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [currentTime, setCurrentTime] = useState(new Date())
  const [takenMedications, setTakenMedications] = useState<Set<string>>(new Set())
  const [notifiedReminders, setNotifiedReminders] = useState<Set<string>>(new Set())
  const [advisorOpen, setAdvisorOpen] = useState(false)
  const [selectedMissedMed, setSelectedMissedMed] = useState<{
    medication: Medication
    scheduledTime: string
    nextScheduledTime?: string
  } | null>(null)
  const supabase = createClient()
  const { toast } = useToast()

  useEffect(() => {
    loadReminders()
    const interval = setInterval(() => {
      setCurrentTime(new Date())
    }, 60000) // Check every minute

    return () => clearInterval(interval)
  }, [userId]) // Only re-run when userId changes

  useEffect(() => {
    checkForDueReminders()
  }, [currentTime, reminders])

  useEffect(() => {
    requestNotificationPermission()
  }, [])

  const loadReminders = async () => {
    setIsLoading(true)

    // Load medications with their conditions
    const { data: medications, error: medError } = await supabase
      .from("medications")
      .select("*, conditions(id, name)")
      .eq("user_id", userId)

    if (medError) {
      console.error("Error loading medications:", medError)
      setIsLoading(false)
      return
    }

    // Create reminder items for each medication time
    const reminderItems: ReminderItem[] = []
    const now = new Date()
    const currentTimeStr = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`

    medications?.forEach((med: any) => {
      const condition = med.conditions
      med.reminder_times.forEach((time: string) => {
        const isPast = time < currentTimeStr
        const isUpcoming = !isPast && time <= addMinutes(currentTimeStr, 60)

        reminderItems.push({
          medication: med,
          condition: condition,
          time: time,
          isPast: isPast,
          isUpcoming: isUpcoming,
        })
      })
    })

    // Sort by time
    reminderItems.sort((a, b) => a.time.localeCompare(b.time))

    setReminders(reminderItems)
    setIsLoading(false)
  }

  const addMinutes = (timeStr: string, minutes: number): string => {
    const [hours, mins] = timeStr.split(":").map(Number)
    const date = new Date()
    date.setHours(hours, mins + minutes)
    return `${date.getHours().toString().padStart(2, "0")}:${date.getMinutes().toString().padStart(2, "0")}`
  }

  const markAsTaken = (medicationId: string, time: string) => {
    const key = `${medicationId}-${time}`
    setTakenMedications((prev) => new Set(prev).add(key))

    toast({
      title: "✓ Medication Taken",
      description: `Marked as taken for ${formatTime(time)}`,
    })
  }

  const requestNotificationPermission = async () => {
    if ("Notification" in window && Notification.permission === "default") {
      const permission = await Notification.requestPermission()
      if (permission === "granted") {
        toast({
          title: "Notifications Enabled",
          description: "You'll receive reminders when medications are due",
        })
      }
    }
  }

  const checkForDueReminders = () => {
    const now = new Date()
    const currentTimeStr = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`

    reminders.forEach((reminder) => {
      const reminderKey = `${reminder.medication.id}-${reminder.time}`

      // Check if medication is due now and hasn't been notified or taken
      if (
        reminder.time === currentTimeStr &&
        !notifiedReminders.has(reminderKey) &&
        !isTaken(reminder.medication.id, reminder.time)
      ) {
        // Send browser notification
        if ("Notification" in window && Notification.permission === "granted") {
          const notification = new Notification("💊 Medication Reminder", {
            body: `Time to take ${reminder.medication.name} (${reminder.medication.dosage})`,
            icon: "/favicon.ico",
            tag: reminderKey,
            requireInteraction: true,
          })

          notification.onclick = () => {
            window.focus()
            notification.close()
          }
        }

        // Show in-app toast notification
        toast({
          title: "💊 Medication Reminder",
          description: `Time to take ${reminder.medication.name} (${reminder.medication.dosage})`,
          duration: 10000,
        })

        // Mark as notified
        setNotifiedReminders((prev) => new Set(prev).add(reminderKey))
      }
    })
  }

  const isTaken = (medicationId: string, time: string): boolean => {
    return takenMedications.has(`${medicationId}-${time}`)
  }

  const formatTime = (time: string): string => {
    const [hours, minutes] = time.split(":")
    const hour = Number.parseInt(hours)
    const ampm = hour >= 12 ? "PM" : "AM"
    const displayHour = hour % 12 || 12
    return `${displayHour}:${minutes} ${ampm}`
  }

  const upcomingReminders = reminders.filter((r) => r.isUpcoming && !isTaken(r.medication.id, r.time))
  const todayReminders = reminders.filter((r) => !isTaken(r.medication.id, r.time))
  const completedToday = reminders.filter((r) => r.isPast && isTaken(r.medication.id, r.time)).length

  const openMissedMedAdvisor = (medication: Medication, scheduledTime: string) => {
    // Find next scheduled time for this medication
    const nextTime = medication.reminder_times.find((t) => t > scheduledTime)
    setSelectedMissedMed({
      medication,
      scheduledTime,
      nextScheduledTime: nextTime,
    })
    setAdvisorOpen(true)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-teal-700">Loading reminders...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-teal-100">
          <CardHeader className="pb-3">
            <CardDescription>Upcoming (Next Hour)</CardDescription>
            <CardTitle className="text-3xl text-teal-900">{upcomingReminders.length}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <BellRing className="h-4 w-4 text-teal-600" />
              <span>Medications due soon</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-teal-100">
          <CardHeader className="pb-3">
            <CardDescription>Today's Schedule</CardDescription>
            <CardTitle className="text-3xl text-teal-900">{todayReminders.length}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4 text-teal-600" />
              <span>Total reminders</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-teal-100">
          <CardHeader className="pb-3">
            <CardDescription>Completed Today</CardDescription>
            <CardTitle className="text-3xl text-teal-900">{completedToday}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CheckCircle2 className="h-4 w-4 text-teal-600" />
              <span>Medications taken</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Reminders */}
      {upcomingReminders.length > 0 && (
        <Card className="border-orange-200 bg-orange-50/50">
          <CardHeader>
            <div className="flex items-center gap-2">
              <BellRing className="h-5 w-5 text-orange-600" />
              <CardTitle className="text-orange-900">Upcoming Reminders</CardTitle>
            </div>
            <CardDescription>Medications due in the next hour</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {upcomingReminders.map((reminder, index) => (
                <div
                  key={`${reminder.medication.id}-${reminder.time}-${index}`}
                  className="flex items-center justify-between rounded-lg border border-orange-200 bg-white p-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-100">
                      <Pill className="h-5 w-5 text-orange-600" />
                    </div>
                    <div>
                      <p className="font-medium text-orange-900">{reminder.medication.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {reminder.medication.dosage} • {reminder.condition.name}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant="secondary" className="bg-orange-100 text-orange-700">
                      {formatTime(reminder.time)}
                    </Badge>
                    <Button
                      size="sm"
                      onClick={() => markAsTaken(reminder.medication.id, reminder.time)}
                      className="bg-teal-600 hover:bg-teal-700"
                    >
                      Mark Taken
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* All Reminders */}
      <Card className="border-teal-100">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-teal-600" />
            <CardTitle className="text-teal-900">Today's Schedule</CardTitle>
          </div>
          <CardDescription>All medication reminders for today</CardDescription>
        </CardHeader>
        <CardContent>
          {reminders.length === 0 ? (
            <div className="py-8 text-center">
              <Bell className="mx-auto mb-4 h-12 w-12 text-teal-300" />
              <p className="text-sm text-muted-foreground">No reminders scheduled</p>
              <p className="text-xs text-muted-foreground">Add medications with reminder times to see them here</p>
            </div>
          ) : (
            <div className="space-y-3">
              {reminders.map((reminder, index) => {
                const taken = isTaken(reminder.medication.id, reminder.time)
                return (
                  <div
                    key={`${reminder.medication.id}-${reminder.time}-${index}`}
                    className={`flex items-center justify-between rounded-lg border p-4 transition-colors ${
                      taken
                        ? "border-green-200 bg-green-50/50"
                        : reminder.isPast
                          ? "border-gray-200 bg-gray-50/50"
                          : "border-teal-200 bg-white"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex h-10 w-10 items-center justify-center rounded-full ${
                          taken ? "bg-green-100" : reminder.isPast ? "bg-gray-100" : "bg-teal-100"
                        }`}
                      >
                        {taken ? (
                          <CheckCircle2 className="h-5 w-5 text-green-600" />
                        ) : (
                          <Pill className={`h-5 w-5 ${reminder.isPast ? "text-gray-400" : "text-teal-600"}`} />
                        )}
                      </div>
                      <div>
                        <p
                          className={`font-medium ${taken ? "text-green-900" : reminder.isPast ? "text-gray-500" : "text-teal-900"}`}
                        >
                          {reminder.medication.name}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {reminder.medication.dosage} • {reminder.condition.name}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge
                        variant="secondary"
                        className={
                          taken
                            ? "bg-green-100 text-green-700"
                            : reminder.isPast
                              ? "bg-gray-100 text-gray-600"
                              : "bg-teal-100 text-teal-700"
                        }
                      >
                        {formatTime(reminder.time)}
                      </Badge>
                      {!taken && reminder.isPast && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openMissedMedAdvisor(reminder.medication, reminder.time)}
                          className="border-amber-300 text-amber-700 hover:bg-amber-50"
                        >
                          <HelpCircle className="mr-1 h-4 w-4" />
                          Get Advice
                        </Button>
                      )}
                      {!taken && !reminder.isPast && (
                        <Button
                          size="sm"
                          onClick={() => markAsTaken(reminder.medication.id, reminder.time)}
                          className="bg-teal-600 hover:bg-teal-700"
                        >
                          Mark Taken
                        </Button>
                      )}
                      {taken && (
                        <Badge variant="secondary" className="bg-green-100 text-green-700">
                          Taken
                        </Badge>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Missed Medication Advisor Dialog */}
      {selectedMissedMed && (
        <MissedMedicationAdvisor
          open={advisorOpen}
          onOpenChange={setAdvisorOpen}
          medicationName={selectedMissedMed.medication.name}
          dosage={selectedMissedMed.medication.dosage}
          scheduledTime={selectedMissedMed.scheduledTime}
          nextScheduledTime={selectedMissedMed.nextScheduledTime}
          onMarkTaken={() => {
            markAsTaken(selectedMissedMed.medication.id, selectedMissedMed.scheduledTime)
            setAdvisorOpen(false)
          }}
        />
      )}
    </div>
  )
}
