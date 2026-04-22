"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { CheckCircle2, Clock, Circle, AlertCircle } from "lucide-react"

interface ChecklistItem {
  id: string
  title: string
  assignedTo: string | null
  status: string
  dueDate: string | null
}

interface PortalData {
  matter: {
    clientName: string
    propertyAddress: string
    transactionType: string
    closingDate: string | null
    state: string | null
    status: string
  }
  checklist: ChecklistItem[]
  progress: { total: number; complete: number; percent: number }
}

const ASSIGNED_LABELS: Record<string, string> = {
  attorney: "Attorney",
  buyer: "Buyer",
  seller: "Seller",
  lender: "Lender",
  title_company: "Title Company",
  agent: "Agent",
}

const STATUS_ICON = {
  complete: <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />,
  in_progress: <Clock className="h-5 w-5 text-amber-500 shrink-0" />,
  pending: <Circle className="h-5 w-5 text-muted-foreground/40 shrink-0" />,
}

function formatDate(iso: string | null) {
  if (!iso) return null
  return new Date(iso).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
}

export default function MatterPortalPage() {
  const { token } = useParams<{ token: string }>()
  const [data, setData] = useState<PortalData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/checklist/portal?token=${token}`)
      .then(r => r.json())
      .then(d => {
        if (d.error) setError(d.error)
        else setData(d)
      })
      .catch(() => setError("Unable to load your closing status."))
      .finally(() => setLoading(false))
  }, [token])

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground text-sm">Loading your closing status...</div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center max-w-sm">
          <AlertCircle className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <h2 className="text-lg font-semibold mb-2">Access Denied</h2>
          <p className="text-sm text-muted-foreground">{error ?? "Invalid or expired link."}</p>
        </div>
      </div>
    )
  }

  const { matter, checklist, progress } = data
  const byAssigned = checklist.reduce<Record<string, ChecklistItem[]>>((acc, item) => {
    const key = item.assignedTo ?? "other"
    if (!acc[key]) acc[key] = []
    acc[key].push(item)
    return acc
  }, {})

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 py-10">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">TITLEwise</span>
          </div>
          <h1 className="text-2xl font-bold text-foreground">{matter.propertyAddress}</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {matter.transactionType} · {matter.clientName}
            {matter.closingDate && ` · Closing ${formatDate(matter.closingDate)}`}
            {matter.state && ` · ${matter.state}`}
          </p>
        </div>

        {/* Progress bar */}
        <div className="bg-card border border-border rounded-xl p-5 mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-foreground">Closing Progress</span>
            <span className="text-sm font-semibold text-primary">{progress.percent}%</span>
          </div>
          <div className="w-full h-2.5 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-500"
              style={{ width: `${progress.percent}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-2">{progress.complete} of {progress.total} items complete</p>
        </div>

        {/* Checklist by party */}
        <div className="space-y-5">
          {Object.entries(byAssigned).map(([party, items]) => (
            <div key={party} className="bg-card border border-border rounded-xl overflow-hidden">
              <div className="px-5 py-3 border-b border-border bg-muted/30">
                <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  {ASSIGNED_LABELS[party] ?? party}
                </h2>
              </div>
              <div className="divide-y divide-border">
                {items.map(item => (
                  <div key={item.id} className="flex items-start gap-3 px-5 py-3.5">
                    {STATUS_ICON[item.status as keyof typeof STATUS_ICON] ?? STATUS_ICON.pending}
                    <div className="min-w-0 flex-1">
                      <p className={`text-sm ${item.status === "complete" ? "line-through text-muted-foreground" : "text-foreground"}`}>
                        {item.title}
                      </p>
                      {item.dueDate && item.status !== "complete" && (
                        <p className="text-xs text-muted-foreground mt-0.5">Due {formatDate(item.dueDate)}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <p className="text-xs text-muted-foreground text-center mt-8">
          This page is automatically updated as your closing progresses. Powered by TITLEwise.
        </p>
      </div>
    </div>
  )
}
