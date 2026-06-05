"use client"

import { useState, useEffect } from "react"
import { Mail, Send, Loader2, ChevronDown, ChevronUp, Copy, Check } from "lucide-react"
import { cn } from "@/lib/utils"

type EmailItem = {
  id: string
  direction: string
  fromAddress: string
  toAddress: string
  subject: string
  bodyText: string | null
  bodyHtml: string | null
  createdAt: string
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr)
  const now = new Date()
  const diff = now.getTime() - d.getTime()
  const hours = Math.floor(diff / (1000 * 60 * 60))
  if (hours < 1) return "just now"
  if (hours < 24) return `${hours}h ago`
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" })
}

function EmailRow({ email }: { email: EmailItem }) {
  const [expanded, setExpanded] = useState(false)
  const isInbound = email.direction === "inbound"

  return (
    <div className={cn("border-b border-border/50 last:border-0", isInbound ? "bg-card" : "bg-primary/[0.03]")}>
      <button
        onClick={() => setExpanded(v => !v)}
        className="w-full flex items-start gap-3 px-5 py-3 hover:bg-muted/10 transition-colors text-left"
      >
        <div className={cn("mt-0.5 w-5 h-5 rounded-full flex items-center justify-center shrink-0",
          isInbound ? "bg-blue-100" : "bg-primary/10"
        )}>
          <Mail className={cn("h-2.5 w-2.5", isInbound ? "text-blue-600" : "text-primary")} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-semibold text-foreground truncate">
              {isInbound ? email.fromAddress : `To: ${email.toAddress}`}
            </p>
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-[10px] text-muted-foreground">{formatDate(email.createdAt)}</span>
              {expanded
                ? <ChevronUp className="h-3 w-3 text-muted-foreground/60" />
                : <ChevronDown className="h-3 w-3 text-muted-foreground/60" />
              }
            </div>
          </div>
          <p className="text-[10px] text-muted-foreground truncate mt-0.5">{email.subject}</p>
          {!expanded && email.bodyText && (
            <p className="text-[10px] text-muted-foreground/60 truncate mt-0.5">{email.bodyText.slice(0, 100)}</p>
          )}
        </div>
      </button>
      {expanded && (
        <div className="px-5 pb-4 pt-1">
          <div className="bg-muted/20 rounded-lg p-3 border border-border/50">
            {email.bodyHtml ? (
              <div
                className="text-xs text-foreground leading-relaxed prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: email.bodyHtml }}
              />
            ) : (
              <pre className="text-xs text-foreground leading-relaxed whitespace-pre-wrap font-sans">{email.bodyText}</pre>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default function EmailThreadsPanel({ matterId }: { matterId: string }) {
  const [emails, setEmails] = useState<EmailItem[]>([])
  const [inboxAddress, setInboxAddress] = useState("")
  const [loading, setLoading] = useState(true)
  const [showCompose, setShowCompose] = useState(false)
  const [sending, setSending] = useState(false)
  const [sendError, setSendError] = useState("")
  const [copied, setCopied] = useState(false)
  const [form, setForm] = useState({ to: "", subject: "", body: "" })

  useEffect(() => {
    fetch(`/api/matters/${matterId}/emails`)
      .then(r => r.json())
      .then(d => {
        setEmails(d.emails ?? [])
        setInboxAddress(d.inboxAddress ?? "")
      })
      .finally(() => setLoading(false))
  }, [matterId])

  async function handleSend() {
    if (!form.to.trim() || !form.subject.trim() || !form.body.trim()) return
    setSending(true)
    setSendError("")
    const res = await fetch(`/api/matters/${matterId}/emails`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ to: form.to.trim(), subject: form.subject.trim(), body: form.body.trim() }),
    })
    const data = await res.json()
    if (data.ok) {
      setEmails(prev => [...prev, {
        id: crypto.randomUUID(),
        direction: "outbound",
        fromAddress: "hello@titlewise.app",
        toAddress: form.to.trim(),
        subject: form.subject.trim(),
        bodyText: form.body.trim(),
        bodyHtml: null,
        createdAt: new Date().toISOString(),
      }])
      setForm({ to: "", subject: "", body: "" })
      setShowCompose(false)
    } else {
      setSendError(data.error ?? "Send failed")
    }
    setSending(false)
  }

  function copyInbox() {
    navigator.clipboard.writeText(inboxAddress)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4">
        <div className="flex items-center gap-2">
          <Mail className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-semibold text-foreground">Email Thread</span>
          {emails.length > 0 && (
            <span className="text-xs text-muted-foreground">({emails.length})</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {inboxAddress && (
            <button
              onClick={copyInbox}
              className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors"
              title={inboxAddress}
            >
              {copied ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
              <span className="hidden sm:inline">{copied ? "Copied" : inboxAddress.split("@")[0]}</span>
            </button>
          )}
          <button
            onClick={() => setShowCompose(v => !v)}
            className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors font-medium"
          >
            <Send className="h-3.5 w-3.5" />
            Send
          </button>
        </div>
      </div>

      {/* Compose form */}
      {showCompose && (
        <div className="border-t border-border px-5 py-4 bg-muted/20">
          <div className="space-y-2 mb-3">
            <div>
              <label className="text-[10px] font-medium text-muted-foreground block mb-1">To *</label>
              <input
                type="email"
                value={form.to}
                onChange={e => setForm(p => ({ ...p, to: e.target.value }))}
                placeholder="recipient@example.com"
                autoFocus
                className="w-full text-xs bg-card border border-border rounded-md px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground/50"
              />
            </div>
            <div>
              <label className="text-[10px] font-medium text-muted-foreground block mb-1">Subject *</label>
              <input
                type="text"
                value={form.subject}
                onChange={e => setForm(p => ({ ...p, subject: e.target.value }))}
                placeholder="Re: Closing update for..."
                className="w-full text-xs bg-card border border-border rounded-md px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground/50"
              />
            </div>
            <div>
              <label className="text-[10px] font-medium text-muted-foreground block mb-1">Message *</label>
              <textarea
                value={form.body}
                onChange={e => setForm(p => ({ ...p, body: e.target.value }))}
                placeholder="Type your message here..."
                rows={4}
                className="w-full text-xs bg-card border border-border rounded-md px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground/50 resize-none"
              />
            </div>
          </div>
          {sendError && <p className="text-xs text-red-500 mb-2">{sendError}</p>}
          <div className="flex gap-2">
            <button
              onClick={handleSend}
              disabled={sending || !form.to.trim() || !form.subject.trim() || !form.body.trim()}
              className="flex items-center gap-1 px-3 py-1.5 bg-primary text-white text-xs font-medium rounded-md hover:bg-primary/90 disabled:opacity-60 transition-colors"
            >
              {sending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />}
              {sending ? "Sending..." : "Send email"}
            </button>
            <button
              onClick={() => { setShowCompose(false); setSendError("") }}
              className="px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Cancel
            </button>
          </div>
          <p className="text-[10px] text-muted-foreground/60 mt-2">
            Replies to this email will be forwarded to {inboxAddress || "this matter's inbox"}.
          </p>
        </div>
      )}

      {/* Thread */}
      {loading && (
        <div className="border-t border-border px-5 py-4">
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        </div>
      )}

      {!loading && emails.length === 0 && !showCompose && (
        <div className="border-t border-border px-5 py-4">
          <p className="text-xs text-muted-foreground">No emails yet.</p>
          {inboxAddress && (
            <p className="text-[10px] text-muted-foreground/60 mt-1">
              Share <span className="font-mono">{inboxAddress}</span> with parties so replies land here automatically.
            </p>
          )}
        </div>
      )}

      {!loading && emails.length > 0 && (
        <div className="border-t border-border">
          {emails.map(email => (
            <EmailRow key={email.id} email={email} />
          ))}
        </div>
      )}
    </div>
  )
}
