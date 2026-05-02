"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Loader2, Webhook, Copy, Check, AlertCircle, Trash2, RefreshCw } from "lucide-react"
import { cn } from "@/lib/utils"

type WebhookData = {
  id: string
  url: string
  events: string[]
  isActive: string
  lastTriggeredAt: string | null
  failureCount: number
  createdAt: string
}

export function WebhooksSection() {
  const [webhooks, setWebhooks] = useState<WebhookData[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [newUrl, setNewUrl] = useState("")
  const [selectedEvents, setSelectedEvents] = useState<string[]>(["analysis.completed"])
  const [newWebhook, setNewWebhook] = useState<{ secret: string } | null>(null)
  const [copiedSecret, setCopiedSecret] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const availableEvents = [
    { value: "analysis.completed", label: "Analysis Completed" },
    { value: "analysis.failed", label: "Analysis Failed" },
  ]

  useEffect(() => {
    loadWebhooks()
  }, [])

  async function loadWebhooks() {
    setLoading(true)
    try {
      const res = await fetch("/api/webhooks")
      const data = await res.json()
      setWebhooks(data.webhooks || [])
    } catch (err) {
      console.error("Failed to load webhooks:", err)
    } finally {
      setLoading(false)
    }
  }

  async function handleCreate() {
    if (!newUrl.trim()) {
      setError("Webhook URL is required")
      return
    }

    try {
      new URL(newUrl)
    } catch {
      setError("Invalid URL format")
      return
    }

    setCreating(true)
    setError(null)
    setNewWebhook(null)

    try {
      const res = await fetch("/api/webhooks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: newUrl.trim(),
          events: selectedEvents,
        }),
      })

      const data = await res.json()

      if (data.error) {
        setError(data.error)
        return
      }

      setNewWebhook({ secret: data.secret })
      setNewUrl("")
      setSelectedEvents(["analysis.completed"])
      await loadWebhooks()
    } catch (err) {
      setError("Failed to create webhook")
    } finally {
      setCreating(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this webhook? This cannot be undone.")) return

    try {
      await fetch(`/api/webhooks?id=${id}`, { method: "DELETE" })
      await loadWebhooks()
    } catch (err) {
      console.error("Failed to delete webhook:", err)
    }
  }

  async function handleToggle(id: string, currentActive: string) {
    try {
      await fetch("/api/webhooks", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          isActive: currentActive === "true" ? "false" : "true",
        }),
      })
      await loadWebhooks()
    } catch (err) {
      console.error("Failed to toggle webhook:", err)
    }
  }

  async function handleResetFailures(id: string) {
    try {
      await fetch("/api/webhooks/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      })
      await loadWebhooks()
    } catch (err) {
      console.error("Failed to reset failures:", err)
    }
  }

  function copySecret(secret: string) {
    navigator.clipboard.writeText(secret)
    setCopiedSecret(true)
    setTimeout(() => setCopiedSecret(false), 2000)
  }

  if (loading) {
    return (
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.24, duration: 0.4 }}
        className="bg-card rounded-xl border border-border p-5 mb-4"
      >
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground/40" />
        </div>
      </motion.section>
    )
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.24, duration: 0.4 }}
      className="bg-card rounded-xl border border-border p-5 mb-4"
    >
      <div className="flex items-center gap-2 mb-1">
        <Webhook className="h-4 w-4 text-muted-foreground" />
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Webhooks</h2>
      </div>
      <p className="text-xs text-muted-foreground mb-4">
        Receive real-time notifications when API analyses complete or fail.
      </p>

      {/* New webhook created alert */}
      <AnimatePresence>
        {newWebhook && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="mb-4 p-4 bg-green-500/10 border border-green-500/20 rounded-lg"
          >
            <div className="flex items-start gap-2 mb-2">
              <Check className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium text-green-700 mb-1">Webhook created successfully</p>
                <p className="text-xs text-green-600/80 mb-3">
                  Save your signing secret now — it won't be shown again. Use it to verify webhook signatures.
                </p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-xs font-mono bg-green-500/10 px-3 py-2 rounded border border-green-500/20 break-all">
                    {newWebhook.secret}
                  </code>
                  <button
                    onClick={() => copySecret(newWebhook.secret)}
                    className="px-3 py-2 text-xs font-medium bg-green-600 hover:bg-green-700 text-white rounded transition-colors shrink-0"
                  >
                    {copiedSecret ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error alert */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="mb-4 flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-700"
          >
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Create webhook form */}
      <div className="mb-6 p-4 bg-muted/20 rounded-lg border border-border">
        <p className="text-xs font-medium text-foreground mb-3">Create Webhook</p>

        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1">Endpoint URL</label>
            <input
              type="url"
              placeholder="https://api.yourdomain.com/webhooks/titlewise"
              value={newUrl}
              onChange={(e) => {
                setNewUrl(e.target.value)
                setError(null)
              }}
              className="w-full text-sm text-foreground bg-background border border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-2">Events to subscribe</label>
            <div className="space-y-2">
              {availableEvents.map((event) => (
                <label key={event.value} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedEvents.includes(event.value)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedEvents([...selectedEvents, event.value])
                      } else {
                        setSelectedEvents(selectedEvents.filter((ev) => ev !== event.value))
                      }
                    }}
                    className="rounded border-border text-primary focus:ring-primary"
                  />
                  <span className="text-sm text-foreground">{event.label}</span>
                </label>
              ))}
            </div>
          </div>

          <button
            onClick={handleCreate}
            disabled={creating || !newUrl.trim() || selectedEvents.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
          >
            {creating ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Webhook className="h-3.5 w-3.5" />
                Create Webhook
              </>
            )}
          </button>
        </div>
      </div>

      {/* Existing webhooks */}
      {webhooks.length === 0 ? (
        <div className="py-8 text-center">
          <Webhook className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">No webhooks configured yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {webhooks.map((webhook) => (
            <div
              key={webhook.id}
              className={cn(
                "p-4 rounded-lg border transition-all",
                webhook.isActive === "true"
                  ? "bg-background border-border"
                  : "bg-muted/20 border-muted-foreground/20"
              )}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <code className="text-xs font-mono text-foreground break-all">{webhook.url}</code>
                    {webhook.isActive === "false" && (
                      <span className="text-xs bg-yellow-500/10 text-yellow-700 px-2 py-0.5 rounded">Disabled</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>Events: {webhook.events.join(", ")}</span>
                    {webhook.lastTriggeredAt && (
                      <span>• Last triggered: {new Date(webhook.lastTriggeredAt).toLocaleString()}</span>
                    )}
                  </div>
                </div>
              </div>

              {webhook.failureCount > 0 && (
                <div className="flex items-center gap-2 mb-2 text-xs text-red-600">
                  <AlertCircle className="h-3.5 w-3.5" />
                  {webhook.failureCount} consecutive failures
                  {webhook.failureCount >= 10 && " (auto-disabled)"}
                </div>
              )}

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleToggle(webhook.id, webhook.isActive)}
                  className={cn(
                    "text-xs px-3 py-1.5 rounded-md font-medium transition-colors",
                    webhook.isActive === "true"
                      ? "bg-yellow-500/10 text-yellow-700 hover:bg-yellow-500/20"
                      : "bg-green-500/10 text-green-700 hover:bg-green-500/20"
                  )}
                >
                  {webhook.isActive === "true" ? "Disable" : "Enable"}
                </button>

                {webhook.failureCount > 0 && (
                  <button
                    onClick={() => handleResetFailures(webhook.id)}
                    className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-md font-medium bg-blue-500/10 text-blue-700 hover:bg-blue-500/20 transition-colors"
                  >
                    <RefreshCw className="h-3 w-3" />
                    Reset Failures
                  </button>
                )}

                <button
                  onClick={() => handleDelete(webhook.id)}
                  className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-md font-medium bg-red-500/10 text-red-700 hover:bg-red-500/20 transition-colors ml-auto"
                >
                  <Trash2 className="h-3 w-3" />
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Documentation */}
      <div className="mt-6 p-4 bg-blue-500/5 border border-blue-500/20 rounded-lg">
        <p className="text-xs font-medium text-blue-700 mb-2">Webhook Security</p>
        <p className="text-xs text-blue-600/80 mb-2">
          All webhook requests include an <code className="bg-blue-500/10 px-1 py-0.5 rounded">X-Webhook-Signature</code> header.
          Verify this HMAC-SHA256 signature using your signing secret to ensure requests came from TitleWise.
        </p>
        <a
          href="/api-docs#webhooks"
          className="text-xs text-blue-600 hover:text-blue-700 font-medium underline"
        >
          View webhook verification guide →
        </a>
      </div>
    </motion.section>
  )
}
