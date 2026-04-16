"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Loader2, ExternalLink, Check } from "lucide-react"

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
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground/40" />
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
      <motion.h1
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="text-2xl font-semibold text-foreground mb-6"
      >
        Settings
      </motion.h1>

      {/* Profile */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.4 }}
        className="bg-card rounded-xl border border-border p-5 mb-4"
      >
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-4">Profile</h2>
        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1">Email</label>
            <p className="text-sm text-foreground">{settings.email}</p>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1">Firm Name</label>
            <input
              type="text"
              value={firmName}
              onChange={(e) => setFirmName(e.target.value)}
              placeholder="e.g. Smith & Associates"
              className={inputClass}
            />
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-1.5 px-4 py-2 bg-primary hover:bg-primary/90 disabled:opacity-60 text-white text-sm font-medium rounded-lg transition-colors"
          >
            {saving ? (
              <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Saving...</>
            ) : saved ? (
              <><Check className="h-3.5 w-3.5" /> Saved</>
            ) : (
              "Save Changes"
            )}
          </button>
        </div>
      </motion.section>

      {/* Subscription */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.18, duration: 0.4 }}
        className="bg-card rounded-xl border border-border p-5 mb-4"
      >
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-4">Subscription</h2>
        <div className="space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Status</span>
            <span className="font-medium text-foreground">
              {statusLabel[settings.subscriptionStatus ?? "inactive"] ?? settings.subscriptionStatus}
            </span>
          </div>
          {settings.subscriptionTier && (
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Plan</span>
              <span className="font-medium text-foreground capitalize">{settings.subscriptionTier.replace("_", " ")}</span>
            </div>
          )}
          {trialActive && (
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Trial</span>
              <span className="font-medium text-primary">{daysLeft} days remaining</span>
            </div>
          )}
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Generations this month</span>
            <span className="font-medium text-foreground">{settings.monthlyUsageCount ?? 0}</span>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-border flex gap-3">
          {settings.hasStripeCustomer ? (
            <button
              onClick={handlePortal}
              disabled={portalLoading}
              className="flex items-center gap-1.5 px-4 py-2 border border-border hover:bg-muted/40 text-sm font-medium text-foreground rounded-lg transition-colors"
            >
              {portalLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ExternalLink className="h-3.5 w-3.5" />}
              Manage Billing
            </button>
          ) : (
            <a
              href="/pricing"
              className="px-4 py-2 bg-primary hover:bg-primary/90 text-white text-sm font-medium rounded-lg transition-colors"
            >
              Subscribe
            </a>
          )}
        </div>
      </motion.section>
    </div>
  )
}

const inputClass = "w-full text-sm text-foreground bg-muted/40 border border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
