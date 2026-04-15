"use client"

import { useState, useEffect } from "react"
import { Loader2, ExternalLink } from "lucide-react"

type Settings = {
  name: string | null
  email: string
  firmName: string | null
  subscriptionStatus: string | null
  subscriptionTier: string | null
  trialEndsAt: string | null
  monthlyUsageCount: number | null
  hasStripeCustomer: boolean
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings | null>(null)
  const [name, setName] = useState("")
  const [firmName, setFirmName] = useState("")
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [portalLoading, setPortalLoading] = useState(false)

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((data: Settings) => {
        setSettings(data)
        setName(data.name ?? "")
        setFirmName(data.firmName ?? "")
      })
  }, [])

  async function handleSave() {
    setSaving(true)
    setSaved(false)
    await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, firmName }),
    })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  async function handlePortal() {
    setPortalLoading(true)
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST" })
      const data = await res.json()
      if (data.url) window.location.href = data.url
    } finally {
      setPortalLoading(false)
    }
  }

  if (!settings) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
      </div>
    )
  }

  const statusLabel: Record<string, string> = {
    active: "Active",
    trialing: "Trial",
    inactive: "Free",
    canceled: "Canceled",
    past_due: "Past Due",
  }

  const trialActive = settings.trialEndsAt && new Date(settings.trialEndsAt) > new Date()
  const daysLeft = trialActive
    ? Math.ceil((new Date(settings.trialEndsAt!).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : 0

  return (
    <div className="max-w-2xl mx-auto px-6 py-10">
      <h1 className="text-2xl font-semibold text-slate-900 mb-6">Settings</h1>

      {/* Profile */}
      <section className="bg-white rounded-xl border border-slate-200 p-5 mb-4">
        <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-4">Profile</h2>
        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-slate-500 block mb-1">Email</label>
            <p className="text-sm text-slate-700">{settings.email}</p>
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500 block mb-1">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full text-sm text-slate-800 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500 block mb-1">Firm Name</label>
            <input
              type="text"
              value={firmName}
              onChange={(e) => setFirmName(e.target.value)}
              placeholder="e.g. Smith & Associates"
              className="w-full text-sm text-slate-800 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-medium rounded-lg transition-colors"
          >
            {saving ? "Saving..." : saved ? "Saved" : "Save Changes"}
          </button>
        </div>
      </section>

      {/* Subscription */}
      <section className="bg-white rounded-xl border border-slate-200 p-5 mb-4">
        <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-4">Subscription</h2>
        <div className="space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-slate-500">Status</span>
            <span className="font-medium text-slate-800">
              {statusLabel[settings.subscriptionStatus ?? "inactive"] ?? settings.subscriptionStatus}
            </span>
          </div>
          {settings.subscriptionTier && (
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Plan</span>
              <span className="font-medium text-slate-800 capitalize">{settings.subscriptionTier.replace("_", " ")}</span>
            </div>
          )}
          {trialActive && (
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Trial</span>
              <span className="font-medium text-blue-600">{daysLeft} days remaining</span>
            </div>
          )}
          <div className="flex items-center justify-between">
            <span className="text-slate-500">Generations this month</span>
            <span className="font-medium text-slate-800">{settings.monthlyUsageCount ?? 0}</span>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-slate-100 flex gap-3">
          {settings.hasStripeCustomer ? (
            <button
              onClick={handlePortal}
              disabled={portalLoading}
              className="flex items-center gap-1.5 px-4 py-2 border border-slate-200 hover:bg-slate-50 text-sm font-medium text-slate-700 rounded-lg transition-colors"
            >
              {portalLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ExternalLink className="h-3.5 w-3.5" />}
              Manage Billing
            </button>
          ) : (
            <a
              href="/pricing"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
            >
              Subscribe
            </a>
          )}
        </div>
      </section>
    </div>
  )
}
