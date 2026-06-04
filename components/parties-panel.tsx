"use client"

import { useState, useEffect } from "react"
import { Plus, Trash2, Loader2, Users } from "lucide-react"

type Party = {
  id: string
  role: string
  name: string
  email: string | null
  phone: string | null
  company: string | null
}

const ROLES = [
  { value: "buyer", label: "Buyer" },
  { value: "seller", label: "Seller" },
  { value: "buyers_agent", label: "Buyer's Agent" },
  { value: "listing_agent", label: "Listing Agent" },
  { value: "lender", label: "Lender" },
  { value: "other", label: "Other" },
]

function roleLabel(role: string) {
  return ROLES.find(r => r.value === role)?.label ?? role
}

export default function PartiesPanel({ matterId }: { matterId: string }) {
  const [parties, setParties] = useState<Party[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ role: "buyer", name: "", email: "", phone: "", company: "" })

  useEffect(() => {
    fetch(`/api/matters/${matterId}/parties`)
      .then(r => r.json())
      .then(d => setParties(d.parties ?? []))
      .finally(() => setLoading(false))
  }, [matterId])

  async function handleAdd() {
    if (!form.name.trim()) return
    setSaving(true)
    const res = await fetch(`/api/matters/${matterId}/parties`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        role: form.role,
        name: form.name.trim(),
        email: form.email.trim() || null,
        phone: form.phone.trim() || null,
        company: form.company.trim() || null,
      }),
    })
    const data = await res.json()
    if (data.party) {
      setParties(prev => [...prev, data.party])
      setForm({ role: "buyer", name: "", email: "", phone: "", company: "" })
      setShowForm(false)
    }
    setSaving(false)
  }

  async function handleDelete(partyId: string) {
    setParties(prev => prev.filter(p => p.id !== partyId))
    await fetch(`/api/matters/${matterId}/parties/${partyId}`, { method: "DELETE" })
  }

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-semibold text-foreground">Parties</span>
          {parties.length > 0 && (
            <span className="text-xs text-muted-foreground">({parties.length})</span>
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
          <div className="grid grid-cols-2 gap-2 mb-2">
            <div>
              <label className="text-[10px] font-medium text-muted-foreground block mb-1">Role</label>
              <select
                value={form.role}
                onChange={e => setForm(p => ({ ...p, role: e.target.value }))}
                className="w-full text-xs bg-card border border-border rounded-md px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary"
              >
                {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-medium text-muted-foreground block mb-1">Name *</label>
              <input
                type="text"
                value={form.name}
                onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                onKeyDown={e => e.key === "Enter" && handleAdd()}
                placeholder="Full name"
                className="w-full text-xs bg-card border border-border rounded-md px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground/50"
              />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 mb-3">
            <div>
              <label className="text-[10px] font-medium text-muted-foreground block mb-1">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                placeholder="email@example.com"
                className="w-full text-xs bg-card border border-border rounded-md px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground/50"
              />
            </div>
            <div>
              <label className="text-[10px] font-medium text-muted-foreground block mb-1">Phone</label>
              <input
                type="tel"
                value={form.phone}
                onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
                placeholder="(603) 555-0100"
                className="w-full text-xs bg-card border border-border rounded-md px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground/50"
              />
            </div>
            <div>
              <label className="text-[10px] font-medium text-muted-foreground block mb-1">Company</label>
              <input
                type="text"
                value={form.company}
                onChange={e => setForm(p => ({ ...p, company: e.target.value }))}
                placeholder="Firm name"
                className="w-full text-xs bg-card border border-border rounded-md px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground/50"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleAdd}
              disabled={saving || !form.name.trim()}
              className="flex items-center gap-1 px-3 py-1.5 bg-primary text-white text-xs font-medium rounded-md hover:bg-primary/90 disabled:opacity-60 transition-colors"
            >
              {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3" />}
              {saving ? "Adding..." : "Add party"}
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

      {!loading && parties.length === 0 && !showForm && (
        <div className="border-t border-border px-5 py-4">
          <p className="text-xs text-muted-foreground">No parties added yet.</p>
        </div>
      )}

      {!loading && parties.length > 0 && (
        <div className="border-t border-border divide-y divide-border/50">
          {parties.map(party => (
            <div
              key={party.id}
              className="flex items-center gap-3 px-5 py-3 hover:bg-muted/10 transition-colors group"
            >
              <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <span className="text-[9px] font-bold text-primary uppercase">{party.role.slice(0, 2)}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-xs font-semibold text-foreground truncate">{party.name}</p>
                  <span className="text-[9px] font-medium text-muted-foreground/60 uppercase tracking-wide shrink-0">
                    {roleLabel(party.role)}
                  </span>
                </div>
                <div className="flex items-center gap-3 mt-0.5">
                  {party.email && (
                    <a href={`mailto:${party.email}`} className="text-[10px] text-primary hover:underline truncate">
                      {party.email}
                    </a>
                  )}
                  {party.phone && (
                    <span className="text-[10px] text-muted-foreground">{party.phone}</span>
                  )}
                  {party.company && (
                    <span className="text-[10px] text-muted-foreground/60 truncate">{party.company}</span>
                  )}
                </div>
              </div>
              <button
                onClick={() => handleDelete(party.id)}
                className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Trash2 className="h-3.5 w-3.5 text-muted-foreground/40 hover:text-red-500 transition-colors" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
