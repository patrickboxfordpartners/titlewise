"use client"

import { useState, useEffect, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { Copy, Check, Loader2, RotateCcw, Mail } from "lucide-react"
import { cn } from "@/lib/utils"
import { ShimmerButton } from "@/components/ui/shimmer-button"

const CLOSING_STAGES = [
  "Contract Signed",
  "Title Search Ordered",
  "Title Search Received",
  "Lender Conditions Outstanding",
  "Clear to Close",
  "Closing Scheduled",
  "Closing Completed",
  "Post-Closing",
]

const TRANSACTION_TYPES = ["Purchase", "Sale", "Refinance", "Cash Purchase"]

type FormData = {
  clientName: string
  propertyAddress: string
  transactionType: string
  closingStage: string
  completedItems: string
  outstandingItems: string
  upcomingDeadlines: string
  additionalNotes: string
  attorneyName: string
  tone: string
}

const initialForm: FormData = {
  clientName: "",
  propertyAddress: "",
  transactionType: "Purchase",
  closingStage: "Contract Signed",
  completedItems: "",
  outstandingItems: "",
  upcomingDeadlines: "",
  additionalNotes: "",
  attorneyName: "",
  tone: "professional",
}

export default function StatusUpdatePage() {
  return (
    <Suspense>
      <StatusUpdateContent />
    </Suspense>
  )
}

function StatusUpdateContent() {
  const searchParams = useSearchParams()
  const [form, setForm] = useState<FormData>(initialForm)
  const [output, setOutput] = useState("")
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((data) => {
        setForm((prev) => ({
          ...prev,
          ...(data.name && !prev.attorneyName ? { attorneyName: data.name } : {}),
        }))
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    const prefill: Partial<FormData> = {}
    const fields: (keyof FormData)[] = [
      "clientName", "propertyAddress", "transactionType", "closingStage",
      "completedItems", "outstandingItems", "upcomingDeadlines", "additionalNotes", "tone",
    ]
    for (const field of fields) {
      const val = searchParams.get(field)
      if (val) prefill[field] = val
    }
    if (Object.keys(prefill).length > 0) {
      setForm((prev) => ({ ...prev, ...prefill }))
    }
  }, [searchParams])

  function set(field: keyof FormData, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleGenerate() {
    setError("")
    if (!form.clientName || !form.propertyAddress || !form.attorneyName) {
      setError("Client name, property address, and attorney name are required.")
      return
    }
    setLoading(true)
    setOutput("")
    try {
      const res = await fetch("/api/generate-update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, stream: true }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Generation failed")
      }

      const reader = res.body?.getReader()
      if (!reader) throw new Error("No response stream")

      const decoder = new TextDecoder()
      let buffer = ""
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split("\n\n")
        buffer = lines.pop() || ""
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue
          const json = JSON.parse(line.slice(6))
          if (json.error) throw new Error(json.error)
          if (json.done) break
          if (json.text) setOutput((prev) => prev + json.text)
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(output)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function handleMailto() {
    const subjectMatch = output.match(/^Subject:\s*(.+)/m)
    const subject = subjectMatch ? subjectMatch[1].trim() : `Closing Update — ${form.propertyAddress}`
    const body = output.replace(/^Subject:.*\n?/m, "").trim()
    const mailto = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
    window.location.href = mailto
  }

  const formFields = [
    { key: "clientName", label: "Client Name *", placeholder: "e.g. John and Jane Smith", type: "input" },
    { key: "propertyAddress", label: "Property Address *", placeholder: "e.g. 42 Maple Street, Portsmouth, NH 03801", type: "input" },
  ]

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mb-6"
      >
        <h1 className="text-2xl font-semibold text-foreground">Status Update Generator</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Fill in the file details and get a professional client update email in seconds.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Form */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.4 }}
          className="bg-card rounded-xl border border-border p-5 space-y-4"
        >
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">File Details</h2>

          {formFields.map(({ key, label, placeholder }, i) => (
            <motion.div
              key={key}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.15 + i * 0.06, duration: 0.3 }}
            >
              <Field label={label}>
                <input
                  type="text"
                  value={form[key as keyof FormData]}
                  onChange={(e) => set(key as keyof FormData, e.target.value)}
                  placeholder={placeholder}
                  className={inputClass}
                />
              </Field>
            </motion.div>
          ))}

          <motion.div
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.27, duration: 0.3 }}
            className="grid grid-cols-2 gap-3"
          >
            <Field label="Transaction Type">
              <select
                value={form.transactionType}
                onChange={(e) => set("transactionType", e.target.value)}
                className={inputClass}
              >
                {TRANSACTION_TYPES.map((t) => <option key={t}>{t}</option>)}
              </select>
            </Field>
            <Field label="Current Stage">
              <select
                value={form.closingStage}
                onChange={(e) => set("closingStage", e.target.value)}
                className={inputClass}
              >
                {CLOSING_STAGES.map((s) => <option key={s}>{s}</option>)}
              </select>
            </Field>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.33, duration: 0.3 }}
          >
            <Field label="Completed Items" hint="One per line">
              <textarea
                value={form.completedItems}
                onChange={(e) => set("completedItems", e.target.value)}
                placeholder={"Title search ordered\nHOA docs received\nInspection completed"}
                rows={3}
                className={inputClass}
              />
            </Field>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.39, duration: 0.3 }}
          >
            <Field label="Outstanding Items" hint="One per line">
              <textarea
                value={form.outstandingItems}
                onChange={(e) => set("outstandingItems", e.target.value)}
                placeholder={"Lender to provide clear to close\nBuyer to provide proof of insurance"}
                rows={3}
                className={inputClass}
              />
            </Field>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.45, duration: 0.3 }}
          >
            <Field label="Upcoming Deadlines">
              <input
                type="text"
                value={form.upcomingDeadlines}
                onChange={(e) => set("upcomingDeadlines", e.target.value)}
                placeholder="e.g. Closing scheduled for April 28"
                className={inputClass}
              />
            </Field>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.51, duration: 0.3 }}
          >
            <Field label="Additional Notes">
              <textarea
                value={form.additionalNotes}
                onChange={(e) => set("additionalNotes", e.target.value)}
                placeholder="Anything else the client should know..."
                rows={2}
                className={inputClass}
              />
            </Field>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.57, duration: 0.3 }}
            className="grid grid-cols-2 gap-3"
          >
            <Field label="Attorney Name *">
              <input
                type="text"
                value={form.attorneyName}
                onChange={(e) => set("attorneyName", e.target.value)}
                placeholder="e.g. Sarah J. Collins, Esq."
                className={inputClass}
              />
            </Field>
            <Field label="Tone">
              <select
                value={form.tone}
                onChange={(e) => set("tone", e.target.value)}
                className={inputClass}
              >
                <option value="professional">Formal</option>
                <option value="semi-formal">Semi-Formal</option>
              </select>
            </Field>
          </motion.div>

          <AnimatePresence>
            {error && (
              <motion.p
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                className="text-sm text-red-500"
              >
                {error}
              </motion.p>
            )}
          </AnimatePresence>

          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.63, duration: 0.3 }}
          >
            <ShimmerButton loading={loading} onClick={handleGenerate}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                "Generate Update"
              )}
            </ShimmerButton>
          </motion.div>
        </motion.div>

        {/* Output */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.4 }}
          className="bg-card rounded-xl border border-border p-5 flex flex-col"
        >
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Generated Email</h2>
            <AnimatePresence>
              {output && !loading && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="flex gap-2"
                >
                  <button
                    onClick={() => setOutput("")}
                    className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    Clear
                  </button>
                  <button
                    onClick={handleMailto}
                    className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-md bg-muted text-foreground hover:bg-muted/70 transition-colors"
                  >
                    <Mail className="h-3.5 w-3.5" />
                    Open in Email
                  </button>
                  <button
                    onClick={handleCopy}
                    className={cn(
                      "flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-md transition-colors",
                      copied
                        ? "bg-green-500/10 text-green-600"
                        : "bg-primary/10 text-primary hover:bg-primary/20"
                    )}
                  >
                    {copied ? (
                      <>
                        <Check className="h-3.5 w-3.5" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5" />
                        Copy
                      </>
                    )}
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Streaming view with blinking cursor */}
          {loading && output ? (
            <div className="flex-1 text-sm text-foreground leading-relaxed font-mono bg-muted/40 border border-border rounded-lg p-3 overflow-y-auto whitespace-pre-wrap max-h-[560px]">
              {output}
              <motion.span
                className="inline-block w-0.5 h-3.5 bg-primary ml-0.5 align-text-bottom"
                animate={{ opacity: [1, 0] }}
                transition={{ duration: 0.5, repeat: Infinity }}
              />
            </div>
          ) : output ? (
            <textarea
              value={output}
              onChange={(e) => setOutput(e.target.value)}
              className="flex-1 w-full text-sm text-foreground leading-relaxed resize-none border border-border rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent font-mono bg-muted/40"
              rows={24}
            />
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center border border-dashed border-border rounded-lg p-8 min-h-[400px]">
              {loading ? (
                <div className="flex flex-col items-center gap-3">
                  <div className="flex gap-1.5">
                    {[0, 1, 2].map((i) => (
                      <motion.div
                        key={i}
                        className="w-2 h-2 rounded-full bg-primary/60"
                        animate={{ y: [0, -6, 0] }}
                        transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
                      />
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground">Writing your update...</p>
                </div>
              ) : (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2 }}
                  className="flex flex-col items-center"
                >
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                    <Mail className="h-5 w-5 text-primary" />
                  </div>
                  <p className="text-sm font-medium text-foreground">Your email will appear here</p>
                  <p className="text-xs text-muted-foreground mt-1">Fill in the file details and click Generate</p>
                </motion.div>
              )}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  )
}

function Field({
  label,
  hint,
  children,
}: {
  label: string
  hint?: string
  children: React.ReactNode
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between mb-1">
        <label className="text-xs font-medium text-muted-foreground">{label}</label>
        {hint && <span className="text-xs text-muted-foreground/60">{hint}</span>}
      </div>
      {children}
    </div>
  )
}

const inputClass =
  "w-full text-sm text-foreground bg-muted/40 border border-border rounded-lg px-3 py-2 placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
