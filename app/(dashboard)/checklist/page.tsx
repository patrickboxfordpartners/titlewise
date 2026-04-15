"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Loader2, Plus, FolderOpen, CheckCircle } from "lucide-react"
import { cn } from "@/lib/utils"

type Matter = {
  id: string
  clientName: string
  propertyAddress: string
  transactionType: string
  closingDate: string | null
  status: string
  totalItems: number
  completedItems: number
  createdAt: string
}

const TRANSACTION_TYPES = ["Purchase", "Sale", "Refinance", "Cash Purchase"]

export default function ChecklistPage() {
  const [mattersList, setMattersList] = useState<Matter[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState({ clientName: "", propertyAddress: "", transactionType: "Purchase", closingDate: "" })

  useEffect(() => {
    fetch("/api/checklist").then((r) => r.json()).then((d) => setMattersList(d.matters ?? [])).finally(() => setLoading(false))
  }, [])

  async function handleCreate() {
    if (!form.clientName || !form.propertyAddress) return
    setCreating(true)
    const res = await fetch("/api/checklist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    })
    const data = await res.json()
    if (data.matter) {
      window.location.href = `/checklist/${data.matter.id}`
    }
    setCreating(false)
  }

  function formatDate(d: string) {
    return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" })
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Closing Checklists</h1>
          <p className="text-sm text-slate-500 mt-1">Track every item across your active files.</p>
        </div>
        <button onClick={() => setShowCreate(!showCreate)} className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors">
          <Plus className="h-4 w-4" /> New Matter
        </button>
      </div>

      {/* Create form */}
      {showCreate && (
        <div className="bg-white rounded-xl border border-slate-200 p-5 mb-6 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-slate-600 block mb-1">Client Name</label>
              <input type="text" value={form.clientName} onChange={(e) => setForm({ ...form, clientName: e.target.value })} placeholder="John and Jane Smith" className="w-full text-sm bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 block mb-1">Property Address</label>
              <input type="text" value={form.propertyAddress} onChange={(e) => setForm({ ...form, propertyAddress: e.target.value })} placeholder="42 Maple St, Portsmouth, NH" className="w-full text-sm bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-slate-600 block mb-1">Transaction Type</label>
              <select value={form.transactionType} onChange={(e) => setForm({ ...form, transactionType: e.target.value })} className="w-full text-sm bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
                {TRANSACTION_TYPES.map((t) => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 block mb-1">Closing Date</label>
              <input type="date" value={form.closingDate} onChange={(e) => setForm({ ...form, closingDate: e.target.value })} className="w-full text-sm bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
          <button onClick={handleCreate} disabled={creating || !form.clientName || !form.propertyAddress} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-medium rounded-lg">
            {creating ? "Creating..." : "Create & Generate Checklist"}
          </button>
        </div>
      )}

      {/* Matters list */}
      {loading ? (
        <div className="text-center py-16"><Loader2 className="h-5 w-5 animate-spin text-slate-400 mx-auto" /></div>
      ) : mattersList.length === 0 ? (
        <div className="text-center py-16">
          <FolderOpen className="h-8 w-8 text-slate-300 mx-auto mb-3" />
          <p className="text-sm text-slate-500">No matters yet</p>
          <p className="text-xs text-slate-400 mt-1">Click "New Matter" to create your first closing checklist.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {mattersList.map((m) => {
            const pct = m.totalItems > 0 ? Math.round((m.completedItems / m.totalItems) * 100) : 0
            return (
              <Link key={m.id} href={`/checklist/${m.id}`} className="block bg-white rounded-xl border border-slate-200 p-4 hover:border-blue-200 hover:shadow-sm transition-all">
                <div className="flex items-center justify-between mb-2">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-800 truncate">{m.clientName}</p>
                    <p className="text-xs text-slate-500 truncate">{m.propertyAddress}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs text-slate-400">{m.transactionType}</span>
                    {m.status === "closed" && <span className="text-[10px] font-medium bg-green-50 text-green-700 px-1.5 py-0.5 rounded">Closed</span>}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className={cn("h-full rounded-full transition-all", pct === 100 ? "bg-green-500" : "bg-blue-500")} style={{ width: `${pct}%` }} />
                  </div>
                  <div className="flex items-center gap-1 text-xs text-slate-500 shrink-0">
                    <CheckCircle className="h-3 w-3" />
                    {m.completedItems}/{m.totalItems}
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
