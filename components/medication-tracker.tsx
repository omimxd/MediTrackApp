"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Plus, Trash2, Edit, Pill, Calendar, Clock } from "lucide-react"
import { Badge } from "@/components/ui/badge"

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

interface MedicationForm {
  name: string
  dosage: string
  times_per_day: string
  reminder_times: string
  expiry_date: string
}

export function MedicationTracker({
  userId,
  conditionId,
  conditionName,
}: {
  userId: string
  conditionId: string
  conditionName: string
}) {
  const [medications, setMedications] = useState<Medication[]>([])
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingMedication, setEditingMedication] = useState<Medication | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [formData, setFormData] = useState<MedicationForm>({
    name: "",
    dosage: "",
    times_per_day: "",
    reminder_times: "",
    expiry_date: "",
  })
  const supabase = createClient()

  useEffect(() => {
    loadMedications()
  }, [])

  const loadMedications = async () => {
    setIsLoading(true)
    const { data, error } = await supabase
      .from("medications")
      .select("*")
      .eq("condition_id", conditionId)
      .eq("user_id", userId)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error loading medications:", error)
    } else {
      setMedications(data || [])
    }
    setIsLoading(false)
  }

  const resetForm = () => {
    setFormData({
      name: "",
      dosage: "",
      times_per_day: "",
      reminder_times: "",
      expiry_date: "",
    })
  }

  const addMedication = async () => {
    if (!formData.name.trim() || !formData.dosage.trim() || !formData.times_per_day || !formData.expiry_date) {
      alert("Please fill in all required fields")
      return
    }

    const reminderTimesArray = formData.reminder_times
      .split(",")
      .map((time) => time.trim())
      .filter((time) => time)

    const { error } = await supabase.from("medications").insert({
      condition_id: conditionId,
      name: formData.name,
      dosage: formData.dosage,
      times_per_day: Number.parseInt(formData.times_per_day),
      reminder_times: reminderTimesArray,
      expiry_date: formData.expiry_date,
      user_id: userId,
    })

    if (error) {
      console.error("Error adding medication:", error)
      alert("Error adding medication: " + error.message)
    } else {
      resetForm()
      setIsAddDialogOpen(false)
      loadMedications()
    }
  }

  const updateMedication = async () => {
    if (!editingMedication) return

    const reminderTimesArray = formData.reminder_times
      .split(",")
      .map((time) => time.trim())
      .filter((time) => time)

    const { error } = await supabase
      .from("medications")
      .update({
        name: formData.name,
        dosage: formData.dosage,
        times_per_day: Number.parseInt(formData.times_per_day),
        reminder_times: reminderTimesArray,
        expiry_date: formData.expiry_date,
      })
      .eq("id", editingMedication.id)

    if (error) {
      console.error("Error updating medication:", error)
      alert("Error updating medication: " + error.message)
    } else {
      resetForm()
      setIsEditDialogOpen(false)
      setEditingMedication(null)
      loadMedications()
    }
  }

  const deleteMedication = async (id: string) => {
    if (!confirm("Are you sure you want to delete this medication?")) return

    const { error } = await supabase.from("medications").delete().eq("id", id)

    if (error) {
      console.error("Error deleting medication:", error)
    } else {
      loadMedications()
    }
  }

  const openEditDialog = (medication: Medication) => {
    setEditingMedication(medication)
    setFormData({
      name: medication.name,
      dosage: medication.dosage,
      times_per_day: medication.times_per_day.toString(),
      reminder_times: medication.reminder_times.join(", "),
      expiry_date: medication.expiry_date,
    })
    setIsEditDialogOpen(true)
  }

  const isExpired = (expiryDate: string) => {
    return new Date(expiryDate) < new Date()
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-teal-700">Loading medications...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Card className="border-teal-100">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-teal-900">Medications for {conditionName}</CardTitle>
              <CardDescription>Track dosage, timing, and expiry dates</CardDescription>
            </div>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-teal-600 hover:bg-teal-700">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Medication
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Add New Medication</DialogTitle>
                  <DialogDescription>Enter the medication details</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="med-name">Medication Name *</Label>
                    <Input
                      id="med-name"
                      placeholder="e.g., Metformin"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="dosage">Dosage *</Label>
                    <Input
                      id="dosage"
                      placeholder="e.g., 500mg"
                      value={formData.dosage}
                      onChange={(e) => setFormData({ ...formData, dosage: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="times-per-day">Times per Day *</Label>
                    <Input
                      id="times-per-day"
                      type="number"
                      min="1"
                      placeholder="e.g., 2"
                      value={formData.times_per_day}
                      onChange={(e) => setFormData({ ...formData, times_per_day: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="reminder-times">Reminder Times (HH:MM, comma-separated)</Label>
                    <Input
                      id="reminder-times"
                      placeholder="e.g., 08:00, 20:00"
                      value={formData.reminder_times}
                      onChange={(e) => setFormData({ ...formData, reminder_times: e.target.value })}
                    />
                    <p className="text-xs text-muted-foreground">Use 24-hour format</p>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="expiry-date">Expiry Date *</Label>
                    <Input
                      id="expiry-date"
                      type="date"
                      value={formData.expiry_date}
                      onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
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
                  <Button onClick={addMedication} className="bg-teal-600 hover:bg-teal-700">
                    Add Medication
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {medications.length === 0 ? (
            <div className="py-8 text-center">
              <Pill className="mx-auto mb-4 h-12 w-12 text-teal-300" />
              <p className="text-sm text-muted-foreground">No medications added yet</p>
              <p className="text-xs text-muted-foreground">Click "Add Medication" to get started</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {medications.map((medication) => (
                <Card key={medication.id} className="border-teal-100">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg text-teal-900">{medication.name}</CardTitle>
                        <CardDescription>{medication.dosage}</CardDescription>
                      </div>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openEditDialog(medication)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteMedication(medication.id)}
                          className="text-red-500 hover:bg-red-50 hover:text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="h-4 w-4 text-teal-600" />
                      <span className="text-muted-foreground">
                        {medication.times_per_day} {medication.times_per_day === 1 ? "time" : "times"} per day
                      </span>
                    </div>
                    {medication.reminder_times.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {medication.reminder_times.map((time, index) => (
                          <Badge key={index} variant="secondary" className="bg-teal-100 text-teal-700">
                            {time}
                          </Badge>
                        ))}
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-teal-600" />
                      <span className="text-muted-foreground">
                        Expires: {new Date(medication.expiry_date).toLocaleDateString()}
                      </span>
                      {isExpired(medication.expiry_date) && (
                        <Badge variant="destructive" className="ml-auto">
                          Expired
                        </Badge>
                      )}
                    </div>
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
            <DialogTitle>Edit Medication</DialogTitle>
            <DialogDescription>Update the medication details</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-med-name">Medication Name *</Label>
              <Input
                id="edit-med-name"
                placeholder="e.g., Metformin"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-dosage">Dosage *</Label>
              <Input
                id="edit-dosage"
                placeholder="e.g., 500mg"
                value={formData.dosage}
                onChange={(e) => setFormData({ ...formData, dosage: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-times-per-day">Times per Day *</Label>
              <Input
                id="edit-times-per-day"
                type="number"
                min="1"
                placeholder="e.g., 2"
                value={formData.times_per_day}
                onChange={(e) => setFormData({ ...formData, times_per_day: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-reminder-times">Reminder Times (HH:MM, comma-separated)</Label>
              <Input
                id="edit-reminder-times"
                placeholder="e.g., 08:00, 20:00"
                value={formData.reminder_times}
                onChange={(e) => setFormData({ ...formData, reminder_times: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">Use 24-hour format</p>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-expiry-date">Expiry Date *</Label>
              <Input
                id="edit-expiry-date"
                type="date"
                value={formData.expiry_date}
                onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setIsEditDialogOpen(false)
                setEditingMedication(null)
                resetForm()
              }}
            >
              Cancel
            </Button>
            <Button onClick={updateMedication} className="bg-teal-600 hover:bg-teal-700">
              Update Medication
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
