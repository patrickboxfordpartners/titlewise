"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Loader2, Key, Copy, Check, Eye, EyeOff, Trash2, Plus, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"

type ApiKey = {
  id: string
  name: string
  keyPrefix: string
  rateLimitPerMonth: number
  isActive: string
  lastUsedAt: string | null
  createdAt: string
  usageThisMonth: number
}

type NewKeyResponse = {
  id: string
  key: string // Full key, shown ONCE
  prefix: string
  rateLimit: number
}

export function ApiKeysSection() {
  const [keys, setKeys] = useState<ApiKey[]>([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [newKey, setNewKey] = useState<NewKeyResponse | null>(null)
  const [newKeyName, setNewKeyName] = useState("")
  const [showNewKeyModal, setShowNewKeyModal] = useState(false)
  const [copied, setCopied] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)

  useEffect(() => {
    loadKeys()
  }, [])

  async function loadKeys() {
    setLoading(true)
    const res = await fetch("/api/keys")
    const data = await res.json()
    setKeys(data.keys || [])
    setLoading(false)
  }

  async function handleGenerate() {
    if (!newKeyName.trim()) return
    setGenerating(true)
    const res = await fetch("/api/keys/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newKeyName.trim() })
    })
    const data = await res.json()

    if (data.error) {
      alert(data.error)
      setGenerating(false)
      return
    }

    setNewKey(data)
    setGenerating(false)
    setNewKeyName("")
    setShowNewKeyModal(false)
    loadKeys() // Refresh list
  }

  async function handleRevoke(id: string) {
    if (!confirm("Revoke this API key? Applications using it will immediately stop working.")) return
    setDeleting(id)
    await fetch(`/api/keys/revoke?id=${id}`, { method: "DELETE" })
    loadKeys()
    setDeleting(null)
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) {
    return (
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.26, duration: 0.4 }}
        className="bg-card rounded-xl border border-border p-5 mb-4"
      >
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-4">API Keys</h2>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground/40" />
        </div>
      </motion.section>
    )
  }

  return (
    <>
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.26, duration: 0.4 }}
        className="bg-card rounded-xl border border-border p-5 mb-4"
      >
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">API Keys</h2>
          <button
            onClick={() => setShowNewKeyModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary hover:bg-primary/20 text-xs font-medium rounded-lg transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            Generate Key
          </button>
        </div>
        <p className="text-xs text-muted-foreground mb-4">
          API keys allow external applications to integrate with TitleWise. Available on Enterprise plan.
        </p>

        {/* New key success alert */}
        {newKey && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-green-500/8 border border-green-500/20 rounded-lg p-4 mb-4"
          >
            <div className="flex items-start gap-3">
              <Check className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-green-700 dark:text-green-400 mb-1">
                  API Key Generated
                </p>
                <p className="text-xs text-green-600/80 dark:text-green-400/80 mb-3">
                  Copy this key now — it won't be shown again.
                </p>
                <div className="flex items-center gap-2 bg-green-950/20 border border-green-500/30 rounded-md p-3">
                  <code className="flex-1 text-xs font-mono text-green-700 dark:text-green-300 break-all">
                    {newKey.key}
                  </code>
                  <button
                    onClick={() => copyToClipboard(newKey.key)}
                    className="shrink-0 p-1.5 hover:bg-green-500/20 rounded transition-colors"
                  >
                    {copied ? (
                      <Check className="h-4 w-4 text-green-600" />
                    ) : (
                      <Copy className="h-4 w-4 text-green-600" />
                    )}
                  </button>
                </div>
                <button
                  onClick={() => setNewKey(null)}
                  className="mt-3 text-xs text-green-600 hover:text-green-700 underline"
                >
                  I've saved it securely
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Keys list */}
        {keys.length === 0 ? (
          <div className="text-center py-8 border-2 border-dashed border-border rounded-lg">
            <Key className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No API keys yet</p>
            <p className="text-xs text-muted-foreground/60 mt-1">Generate your first key to get started</p>
          </div>
        ) : (
          <div className="space-y-3">
            {keys.map((key) => (
              <div
                key={key.id}
                className={cn(
                  "flex items-start justify-between p-4 rounded-lg border border-border transition-all",
                  key.isActive === "false" ? "bg-muted/20 opacity-60" : "bg-muted/40"
                )}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-sm font-medium text-foreground">{key.name}</h3>
                    {key.isActive === "false" && (
                      <span className="text-xs px-2 py-0.5 bg-red-500/10 text-red-600 rounded-full">
                        Revoked
                      </span>
                    )}
                  </div>
                  <p className="text-xs font-mono text-muted-foreground mb-2">{key.keyPrefix}...</p>

                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                      <span>
                        {key.usageThisMonth} / {key.rateLimitPerMonth} calls this month
                      </span>
                    </div>
                    {key.lastUsedAt && (
                      <span>
                        Last used {new Date(key.lastUsedAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>

                  {/* Usage bar */}
                  <div className="mt-2 w-full h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className={cn(
                        "h-full transition-all rounded-full",
                        key.usageThisMonth / key.rateLimitPerMonth > 0.9
                          ? "bg-red-500"
                          : key.usageThisMonth / key.rateLimitPerMonth > 0.7
                          ? "bg-yellow-500"
                          : "bg-blue-500"
                      )}
                      style={{ width: `${Math.min(100, (key.usageThisMonth / key.rateLimitPerMonth) * 100)}%` }}
                    />
                  </div>
                </div>

                {key.isActive === "true" && (
                  <button
                    onClick={() => handleRevoke(key.id)}
                    disabled={deleting === key.id}
                    className="ml-4 p-2 text-muted-foreground hover:text-red-600 hover:bg-red-500/10 rounded-lg transition-colors disabled:opacity-50"
                  >
                    {deleting === key.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </motion.section>

      {/* Generate key modal */}
      {showNewKeyModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-card rounded-xl border border-border p-6 max-w-md w-full"
          >
            <h3 className="text-lg font-semibold text-foreground mb-2">Generate API Key</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Create a new API key for external integrations.
            </p>

            <label className="text-xs font-medium text-muted-foreground block mb-1">
              Key Name
            </label>
            <input
              type="text"
              placeholder="Production, Staging, etc."
              value={newKeyName}
              onChange={(e) => setNewKeyName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleGenerate()}
              className="w-full text-sm text-foreground bg-muted/40 border border-border rounded-lg px-3 py-2 mb-4 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              autoFocus
            />

            <div className="flex gap-2">
              <button
                onClick={() => setShowNewKeyModal(false)}
                className="flex-1 px-4 py-2 bg-muted hover:bg-muted/80 text-foreground text-sm font-medium rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleGenerate}
                disabled={generating || !newKeyName.trim()}
                className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2 bg-primary hover:bg-primary/90 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
              >
                {generating ? (
                  <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Generating...</>
                ) : (
                  "Generate"
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </>
  )
}
