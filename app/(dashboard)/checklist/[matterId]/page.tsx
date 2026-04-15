"use client"

import { useState, useEffect, use } from "react"
import { useRouter } from "next/navigation"
import { Loader2, Plus, Trash2, ArrowLeft, CheckCircle, Circle, Clock } from "lucide-react"
import { cn } from "@/lib/utils"

type Item = {
  id: string
  title: string
  assignedTo: string | null
  status: string
  dueDate: string | null
  sortOrder: number
}

type Matter = {
  id: string
  clientName: string
  propertyAddress: string
  transactionType: string
  closingDate: string | null
  status: string
}

const PARTIES = ["attorney", "buyer", "seller", "lender", "title_company", "agent"]
const STATUS_CYCLE = ["pending", "in_progress", "complete"] as const

export default function MatterDetailPage({ params }: { params: Promise<{ matterId: string }> }) {
  const { matterId } = use(params)
  const router = useRouter()
  const [matter, setMatter] = useState<Matter | null>(null)
  const [items, setItems] = useState<Item[]>([])
  const [loading, setLoading] = useState(true)
  const [newTitle, setNewTitle] = useState("")
  const [newAssigned, setNewAssigned] = useState("")
  const [adding, setAdding] = useState(false)

  async function fetchData() {
    const res = await fetch(`/api/checklist/${matterId}`)
    if (!res.ok) { router.push("/checklist"); return }
    const data = await res.json()
    setMatter(data.matter)
    setItems(data.items)
    setLoading(false)
  }

  useEffect(() => { fetchData() }, [matterId])

  async function toggleStatus(item: Item) {
    const currentIdx = STATUS_CYCLE.indexOf(item.status as typeof STATUS_CYCLE[number])
    const nextStatus = STATUS_CYCLE[(currentIdx + 1) % STATUS_CYCLE.length]
    setItems((prev) => prev.map((i) => i.id === item.id ? { ...i, status: nextStatus } : i))
    await fetch(`/api/checklist/${matterId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ itemId: item.id, status: nextStatus }),
    })
  }

  async function addItem() {
    if (!newTitle.trim()) return
    setAdding(true)
    const res = await fetch(`/api/checklist/${matterId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "add", title: newTitle, assignedTo: newAssigned || undefined }),
    })
    const data = await res.json()
    if (data.item) setItems((prev) => [...prev, data.item])
    setNewTitle(""); setNewAssigned("")
    setAdding(false)
  }

  async function deleteItem(itemId: string) {
    setItems((prev) => prev.filter((i) => i.id !== itemId))
    await fetch(`/api/checklist/${matterId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "delete", itemId }),
    })
  }

  async function closeMatter() {
    await fetch(`/api/checklist/${matterId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "close" }),
    })
    router.push("/checklist")
  }

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="h-5 w-5 animate-spin text-slate-400" /></div>
  if (!matter) return null

  const total = items.length
  const complete = items.filter((i) => i.status === "complete").length
  const pct = total > 0 ? Math.round((complete / total) * 100) : 0

  // Group by assignedTo
  const grouped = items.reduce<Record<string, Item[]>>((acc, item) => {
    const key = item.assignedTo || "unassigned"
    if (!acc[key]) acc[key] = []
    acc[key].push(item)
    return acc
  }, {})

  const partyLabels: Record<string, string> = {
    attorney: "Attorney", buyer: "Buyer", seller: "Seller",
    lender: "Lender", title_company: "Title Company", agent: "Agent", unassigned: "Unassigned",
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      {/* Header */}
      <div className="mb-6">
        <button onClick={() => router.push("/checklist")} className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700 mb-3">
          <ArrowLeft className="h-3.5 w-3.5" /> All Matters
        </button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-slate-900">{matter.clientName}</h1>
            <p className="text-sm text-slate-500">{matter.propertyAddress} - {matter.transactionType}</p>
            {matter.closingDate && <p className="text-xs text-slate-400 mt-0.5">Closing: {new Date(matter.closingDate).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</p>}
          </div>
          {matter.status === "active" && (
            <button onClick={closeMatter} className="text-xs text-slate-500 hover:text-slate-700 border border-slate-200 px-3 py-1.5 rounded-md">
              Close Matter
            </button>
          )}
        </div>

        {/* Progress */}
        <div className="flex items-center gap-3 mt-4">
          <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
            <div className={cn("h-full rounded-full transition-all", pct === 100 ? "bg-green-500" : "bg-blue-500")} style={{ width: `${pct}%` }} />
          </div>
          <span className="text-sm font-medium text-slate-700">{pct}%</span>
          <span className="text-xs text-slate-400">{complete}/{total}</span>
        </div>
      </div>

      {/* Items grouped by party */}
      <div className="space-y-4">
        {Object.entries(grouped).sort(([a], [b]) => {
          const order = ["attorney", "buyer", "seller", "lender", "title_company", "agent", "unassigned"]
          return order.indexOf(a) - order.indexOf(b)
        }).map(([party, partyItems]) => (
          <div key={party} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-100">
              <span className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                {partyLabels[party] ?? party}
              </span>
              <span className="text-xs text-slate-400 ml-2">
                {partyItems.filter((i) => i.status === "complete").length}/{partyItems.length}
              </span>
            </div>
            <div className="divide-y divide-slate-50">
              {partyItems.map((item) => (
                <div key={item.id} className="flex items-center gap-3 px-4 py-2.5 group">
                  <button onClick={() => toggleStatus(item)} className="shrink-0">
                    {item.status === "complete" ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : item.status === "in_progress" ? (
                      <Clock className="h-5 w-5 text-blue-500" />
                    ) : (
                      <Circle className="h-5 w-5 text-slate-300 hover:text-slate-400" />
                    )}
                  </button>
                  <span className={cn("text-sm flex-1", item.status === "complete" ? "text-slate-400 line-through" : "text-slate-700")}>
                    {item.title}
                  </span>
                  <button onClick={() => deleteItem(item.id)} className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <Trash2 className="h-3.5 w-3.5 text-slate-300 hover:text-red-500" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Add item */}
      {matter.status === "active" && (
        <div className="mt-4 bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex gap-2">
            <input type="text" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="Add a checklist item..." onKeyDown={(e) => e.key === "Enter" && addItem()} className="flex-1 text-sm bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            <select value={newAssigned} onChange={(e) => setNewAssigned(e.target.value)} className="text-sm bg-slate-50 border border-slate-200 rounded-lg px-2 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">Assign to...</option>
              {PARTIES.map((p) => <option key={p} value={p}>{partyLabels[p]}</option>)}
            </select>
            <button onClick={addItem} disabled={adding || !newTitle.trim()} className="px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg">
              <Plus className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
