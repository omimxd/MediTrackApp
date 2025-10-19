"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Plus, Trash2, Edit, FileText, Calendar } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface HealthLog {
  id: string
  log_date: string
  notes: string
  user_id: string
  created_at: string
}

interface HealthLogForm {
  log_date: string
  notes: string
}

export function HealthLogManager({ userId }: { userId: string }) {
  const [healthLogs, setHealthLogs] = useState<HealthLog[]>([])
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingLog, setEditingLog] = useState<HealthLog | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [formData, setFormData] = useState<HealthLogForm>({
    log_date: new Date().toISOString().split("T")[0],
    notes: "",
  })
  const supabase = createClient()

  useEffect(() => {
    loadHealthLogs()
  }, [])

  const loadHealthLogs = async () => {
    setIsLoading(true)
    const { data, error } = await supabase
      .from("health_logs")
      .select("*")
      .eq("user_id", userId)
      .order("log_date", { ascending: false })

    if (error) {
      console.error("Error loading health logs:", error)
    } else {
      setHealthLogs(data || [])
    }
    setIsLoading(false)
  }

  const resetForm = () => {
    setFormData({
      log_date: new Date().toISOString().split("T")[0],
      notes: "",
    })
  }

  const addHealthLog = async () => {
    if (!formData.log_date || !formData.notes.trim()) {
      alert("Please fill in all fields")
      return
    }

    const { error } = await supabase.from("health_logs").insert({
      log_date: formData.log_date,
      notes: formData.notes,
      user_id: userId,
    })

    if (error) {
      console.error("Error adding health log:", error)
      alert("Error adding health log: " + error.message)
    } else {
      resetForm()
      setIsAddDialogOpen(false)
      loadHealthLogs()
    }
  }

  const updateHealthLog = async () => {
    if (!editingLog) return

    const { error } = await supabase
      .from("health_logs")
      .update({
        log_date: formData.log_date,
        notes: formData.notes,
      })
      .eq("id", editingLog.id)

    if (error) {
      console.error("Error updating health log:", error)
      alert("Error updating health log: " + error.message)
    } else {
      resetForm()
      setIsEditDialogOpen(false)
      setEditingLog(null)
      loadHealthLogs()
    }
  }

  const deleteHealthLog = async (id: string) => {
    if (!confirm("Are you sure you want to delete this health log?")) return

    const { error } = await supabase.from("health_logs").delete().eq("id", id)

    if (error) {
      console.error("Error deleting health log:", error)
    } else {
      loadHealthLogs()
    }
  }

  const openEditDialog = (log: HealthLog) => {
    setEditingLog(log)
    setFormData({
      log_date: log.log_date,
      notes: log.notes,
    })
    setIsEditDialogOpen(true)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const isToday = (dateString: string) => {
    const today = new Date().toISOString().split("T")[0]
    return dateString === today
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-teal-700">Loading health logs...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Card className="border-teal-100">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-teal-900">Your Health Journal</CardTitle>
              <CardDescription>Record daily observations, symptoms, and notes</CardDescription>
            </div>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-teal-600 hover:bg-teal-700">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Log Entry
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Add Health Log</DialogTitle>
                  <DialogDescription>Record your health observations for the day</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="log-date">Date *</Label>
                    <Input
                      id="log-date"
                      type="date"
                      value={formData.log_date}
                      onChange={(e) => setFormData({ ...formData, log_date: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="notes">Notes *</Label>
                    <Textarea
                      id="notes"
                      placeholder="How are you feeling today? Any symptoms or observations?"
                      rows={6}
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsAddDialogOpen(false)
                      resetForm()
                    }}
                  >
                    Cancel
                  </Button>
                  <Button onClick={addHealthLog} className="bg-teal-600 hover:bg-teal-700">
                    Add Log
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {healthLogs.length === 0 ? (
            <div className="py-8 text-center">
              <FileText className="mx-auto mb-4 h-12 w-12 text-teal-300" />
              <p className="text-sm text-muted-foreground">No health logs yet</p>
              <p className="text-xs text-muted-foreground">Start tracking your daily health observations</p>
            </div>
          ) : (
            <div className="space-y-4">
              {healthLogs.map((log) => (
                <Card key={log.id} className="border-teal-100">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-teal-600" />
                          <CardTitle className="text-base text-teal-900">{formatDate(log.log_date)}</CardTitle>
                          {isToday(log.log_date) && (
                            <Badge variant="secondary" className="bg-teal-100 text-teal-700">
                              Today
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openEditDialog(log)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteHealthLog(log.id)}
                          className="text-red-500 hover:bg-red-50 hover:text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="whitespace-pre-wrap text-sm text-muted-foreground">{log.notes}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Health Log</DialogTitle>
            <DialogDescription>Update your health observations</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-log-date">Date *</Label>
              <Input
                id="edit-log-date"
                type="date"
                value={formData.log_date}
                onChange={(e) => setFormData({ ...formData, log_date: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-notes">Notes *</Label>
              <Textarea
                id="edit-notes"
                placeholder="How are you feeling today? Any symptoms or observations?"
                rows={6}
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setIsEditDialogOpen(false)
                setEditingLog(null)
                resetForm()
              }}
            >
              Cancel
            </Button>
            <Button onClick={updateHealthLog} className="bg-teal-600 hover:bg-teal-700">
              Update Log
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
