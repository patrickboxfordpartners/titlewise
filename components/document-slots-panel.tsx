"use client"

import { useState, useEffect } from "react"
import { Plus, Trash2, Loader2, FileText } from "lucide-react"
import { cn } from "@/lib/utils"

type DocumentSlot = {
  id: string
  label: string
  category: string
  status: string
  notes: string | null
  sortOrder: number
}

const CATEGORIES = [
  { value: "contract", label: "Contract" },
  { value: "title", label: "Title" },
  { value: "lender", label: "Lender" },
  { value: "hoa", label: "HOA" },
  { value: "misc", label: "Misc" },
]

const STATUS_CYCLE = ["pending", "received", "waived"] as const

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  received: "bg-green-50 text-green-700 border-green-200",
  waived: "bg-muted text-muted-foreground border-border",
}

const STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  received: "Received",
  waived: "Waived",
}

export default function DocumentSlotsPanel({ matterId }: { matterId: string }) {
  const [slots, setSlots] = useState<DocumentSlot[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ label: "", category: "contract" })

  useEffect(() => {
    fetch(`/api/matters/${matterId}/documents`)
      .then(r => r.json())
      .then(d => setSlots(d.slots ?? []))
      .finally(() => setLoading(false))
  }, [matterId])

  async function handleAdd() {
    if (!form.label.trim()) return
    setSaving(true)
    const res = await fetch(`/api/matters/${matterId}/documents`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ label: form.label.trim(), category: form.category }),
    })
    const data = await res.json()
    if (data.slot) {
      setSlots(prev => [...prev, data.slot])
      setForm({ label: "", category: "contract" })
      setShowForm(false)
    }
    setSaving(false)
  }

  async function cycleStatus(slot: DocumentSlot) {
    const idx = STATUS_CYCLE.indexOf(slot.status as typeof STATUS_CYCLE[number])
    const next = STATUS_CYCLE[(idx + 1) % STATUS_CYCLE.length]
    setSlots(prev => prev.map(s => s.id === slot.id ? { ...s, status: next } : s))
    await fetch(`/api/matters/${matterId}/documents/${slot.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next }),
    })
  }

  async function handleDelete(slotId: string) {
    setSlots(prev => prev.filter(s => s.id !== slotId))
    await fetch(`/api/matters/${matterId}/documents/${slotId}`, { method: "DELETE" })
  }

  const receivedCount = slots.filter(s => s.status === "received").length

  const grouped = CATEGORIES.reduce<Record<string, DocumentSlot[]>>((acc, cat) => {
    const items = slots.filter(s => s.category === cat.value)
    if (items.length > 0) acc[cat.value] = items
    return acc
  }, {})

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-semibold text-foreground">Documents</span>
          {slots.length > 0 && (
            <span className="text-xs text-muted-foreground">({receivedCount}/{slots.length})</span>
          )}
        </div>
        <button
          onClick={() => setShowForm(v => !v)}
          className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors font-medium"
        >
          <Plus className="h-3.5 w-3.5" />
          Add
        </button>
      </div>

      {showForm && (
        <div className="border-t border-border px-5 py-4 bg-muted/20">
          <div className="grid grid-cols-2 gap-2 mb-3">
            <div>
              <label className="text-[10px] font-medium text-muted-foreground block mb-1">Document Name *</label>
              <input
                type="text"
                value={form.label}
                onChange={e => setForm(p => ({ ...p, label: e.target.value }))}
                onKeyDown={e => e.key === "Enter" && handleAdd()}
                placeholder="e.g. Purchase & Sale Agreement"
                autoFocus
                className="w-full text-xs bg-card border border-border rounded-md px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground/50"
              />
            </div>
            <div>
              <label className="text-[10px] font-medium text-muted-foreground block mb-1">Category</label>
              <select
                value={form.category}
                onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
                className="w-full text-xs bg-card border border-border rounded-md px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary"
              >
                {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleAdd}
              disabled={saving || !form.label.trim()}
              className="flex items-center gap-1 px-3 py-1.5 bg-primary text-white text-xs font-medium rounded-md hover:bg-primary/90 disabled:opacity-60 transition-colors"
            >
              {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3" />}
              {saving ? "Adding..." : "Add document"}
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {loading && (
        <div className="border-t border-border px-5 py-4">
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        </div>
      )}

      {!loading && slots.length === 0 && !showForm && (
        <div className="border-t border-border px-5 py-4">
          <p className="text-xs text-muted-foreground">No documents tracked yet.</p>
        </div>
      )}

      {!loading && slots.length > 0 && (
        <div className="border-t border-border">
          {CATEGORIES.filter(c => grouped[c.value]).map(cat => (
            <div key={cat.value}>
              <div className="px-5 py-2 bg-muted/20 border-b border-border/50">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                  {cat.label}
                </p>
              </div>
              {grouped[cat.value].map(slot => (
                <div
                  key={slot.id}
                  className="flex items-center gap-3 px-5 py-3 border-b border-border/50 last:border-0 hover:bg-muted/10 transition-colors group"
                >
                  <button
                    onClick={() => cycleStatus(slot)}
                    className={cn(
                      "shrink-0 px-2 py-0.5 rounded border text-[9px] font-semibold uppercase tracking-wide transition-colors",
                      STATUS_STYLES[slot.status] ?? STATUS_STYLES.pending
                    )}
                  >
                    {STATUS_LABELS[slot.status] ?? slot.status}
                  </button>
                  <span className="flex-1 text-xs text-foreground truncate">{slot.label}</span>
                  <button
                    onClick={() => handleDelete(slot.id)}
                    className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="h-3.5 w-3.5 text-muted-foreground/40 hover:text-red-500 transition-colors" />
                  </button>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
