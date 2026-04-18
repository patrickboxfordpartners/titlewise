"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { Suspense } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Loader2, ExternalLink, Check, Mail, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"

type Settings = {
  name: string | null
  email: string
  firmName: string | null
  subscriptionStatus: string | null
  subscriptionTier: string | null
  monthlyUsageCount: number | null
  hasStripeCustomer: boolean
}

type EmailStatus = { google: boolean; outlook: boolean }

export default function SettingsPage() {
  return (
    <Suspense>
      <SettingsContent />
    </Suspense>
  )
}

function SettingsContent() {
  const searchParams = useSearchParams()
  const [settings, setSettings] = useState<Settings | null>(null)
  const [emailStatus, setEmailStatus] = useState<EmailStatus>({ google: false, outlook: false })
  const [name, setName] = useState("")
  const [firmName, setFirmName] = useState("")
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [portalLoading, setPortalLoading] = useState(false)
  const [disconnecting, setDisconnecting] = useState<"google" | "outlook" | null>(null)

  const connectedParam = searchParams.get("connected")
  const errorParam = searchParams.get("error")

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((data: Settings) => {
        setSettings(data)
        setName(data.name ?? "")
        setFirmName(data.firmName ?? "")
      })
    fetch("/api/email/status")
      .then((r) => r.json())
      .then((data: EmailStatus) => setEmailStatus(data))
  }, [connectedParam]) // re-fetch when returning from OAuth

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

  async function handleDisconnect(provider: "google" | "outlook") {
    setDisconnecting(provider)
    await fetch(`/api/email/disconnect?provider=${provider}`, { method: "DELETE" })
    setEmailStatus((prev) => ({ ...prev, [provider]: false }))
    setDisconnecting(null)
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
    inactive: "Inactive",
    canceled: "Canceled",
    past_due: "Past Due",
  }

  const oauthBannerText: Record<string, string> = {
    google: "Gmail connected successfully.",
    outlook: "Outlook connected successfully.",
    oauth_denied: "Connection cancelled.",
    oauth_invalid: "Invalid OAuth response.",
    oauth_invalid_state: "Session mismatch — please try again.",
    oauth_token_failed: "Could not exchange authorization code. Please try again.",
  }

  const bannerText = connectedParam
    ? oauthBannerText[connectedParam]
    : errorParam
    ? oauthBannerText[errorParam]
    : null
  const bannerIsError = !!errorParam

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

      {/* OAuth result banner */}
      <AnimatePresence>
        {bannerText && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className={cn(
              "flex items-center gap-2 rounded-lg border px-4 py-3 mb-4 text-sm",
              bannerIsError
                ? "bg-red-500/8 border-red-500/20 text-red-700"
                : "bg-green-500/8 border-green-500/20 text-green-700"
            )}
          >
            {bannerIsError ? <AlertCircle className="h-4 w-4 shrink-0" /> : <Check className="h-4 w-4 shrink-0" />}
            {bannerText}
          </motion.div>
        )}
      </AnimatePresence>

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
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1">Firm Name</label>
            <input type="text" value={firmName} onChange={(e) => setFirmName(e.target.value)} placeholder="e.g. Smith & Associates" className={inputClass} />
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

      {/* Connected Email Accounts */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.18, duration: 0.4 }}
        className="bg-card rounded-xl border border-border p-5 mb-4"
      >
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Connected Email</h2>
        <p className="text-xs text-muted-foreground mb-4">
          Send emails directly from TitleWise using your own inbox.
        </p>
        <div className="space-y-3">
          {/* Gmail */}
          <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/20">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-md bg-muted flex items-center justify-center">
                <Mail className="h-4 w-4 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">Gmail</p>
                <p className="text-xs text-muted-foreground">
                  {emailStatus.google ? "Connected — sends from your Gmail account" : "Not connected"}
                </p>
              </div>
            </div>
            {emailStatus.google ? (
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1 text-xs font-medium text-green-600">
                  <Check className="h-3.5 w-3.5" /> Connected
                </span>
                <button
                  onClick={() => handleDisconnect("google")}
                  disabled={disconnecting === "google"}
                  className="text-xs text-muted-foreground hover:text-red-600 border border-border px-2.5 py-1 rounded-md transition-colors disabled:opacity-50"
                >
                  {disconnecting === "google" ? <Loader2 className="h-3 w-3 animate-spin" /> : "Disconnect"}
                </button>
              </div>
            ) : (
              <a
                href="/api/email/connect/google"
                className="text-xs font-medium px-3 py-1.5 bg-primary/10 text-primary hover:bg-primary/20 rounded-md transition-colors"
              >
                Connect Gmail
              </a>
            )}
          </div>

          {/* Outlook */}
          <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/20">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-md bg-muted flex items-center justify-center">
                <Mail className="h-4 w-4 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">Outlook / Microsoft 365</p>
                <p className="text-xs text-muted-foreground">
                  {emailStatus.outlook ? "Connected — sends from your Outlook account" : "Not connected"}
                </p>
              </div>
            </div>
            {emailStatus.outlook ? (
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1 text-xs font-medium text-green-600">
                  <Check className="h-3.5 w-3.5" /> Connected
                </span>
                <button
                  onClick={() => handleDisconnect("outlook")}
                  disabled={disconnecting === "outlook"}
                  className="text-xs text-muted-foreground hover:text-red-600 border border-border px-2.5 py-1 rounded-md transition-colors disabled:opacity-50"
                >
                  {disconnecting === "outlook" ? <Loader2 className="h-3 w-3 animate-spin" /> : "Disconnect"}
                </button>
              </div>
            ) : (
              <a
                href="/api/email/connect/outlook"
                className="text-xs font-medium px-3 py-1.5 bg-primary/10 text-primary hover:bg-primary/20 rounded-md transition-colors"
              >
                Connect Outlook
              </a>
            )}
          </div>
        </div>
      </motion.section>

      {/* Subscription */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.26, duration: 0.4 }}
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
            <a href="/pricing" className="px-4 py-2 bg-primary hover:bg-primary/90 text-white text-sm font-medium rounded-lg transition-colors">
              Subscribe
            </a>
          )}
        </div>
      </motion.section>
    </div>
  )
}

const inputClass = "w-full text-sm text-foreground bg-muted/40 border border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
