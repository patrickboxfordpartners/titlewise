"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Copy, Check, Loader2, RotateCcw, DollarSign } from "lucide-react"
import { cn } from "@/lib/utils"
import { ShimmerButton } from "@/components/ui/shimmer-button"

const TRANSACTION_TYPES = ["Purchase", "Sale", "Refinance", "Cash Purchase", "Commercial", "HELOC"]
const PROPERTY_TYPES = ["Single Family", "Condo/Townhouse", "Multi-Family", "Commercial", "Land"]
const COMPLEXITY_LEVELS = ["Standard", "Moderate", "Complex"]

type FormData = {
  clientName: string
  transactionType: string
  propertyType: string
  jurisdiction: string
  purchasePrice: string
  complexity: string
  additionalServices: string
  firmName: string
  attorneyName: string
}

const initialForm: FormData = {
  clientName: "",
  transactionType: "Purchase",
  propertyType: "Single Family",
  jurisdiction: "",
  purchasePrice: "",
  complexity: "Standard",
  additionalServices: "",
  firmName: "",
  attorneyName: "",
}

export default function FeeEstimatePage() {
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
          ...(data.firmName && !prev.firmName ? { firmName: data.firmName } : {}),
        }))
      })
      .catch(() => {})
  }, [])

  function set(field: keyof FormData, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleGenerate() {
    setError("")
    if (!form.clientName || !form.jurisdiction || !form.attorneyName) {
      setError("Client name, jurisdiction, and attorney name are required.")
      return
    }
    setLoading(true)
    setOutput("")
    try {
      const res = await fetch("/api/generate-fee-estimate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Generation failed")
      }
      const data = await res.json()
      setOutput(data.estimate)
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

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mb-6"
      >
        <h1 className="text-2xl font-semibold text-foreground">Fee Estimate Generator</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Generate a professional fee estimate letter for new client intake.
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
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Transaction Details</h2>

          <motion.div initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15, duration: 0.3 }}>
            <Field label="Client Name *">
              <input type="text" value={form.clientName} onChange={(e) => set("clientName", e.target.value)} placeholder="e.g. John and Jane Smith" className={inputClass} />
            </Field>
          </motion.div>

          <motion.div initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.21, duration: 0.3 }} className="grid grid-cols-2 gap-3">
            <Field label="Transaction Type">
              <select value={form.transactionType} onChange={(e) => set("transactionType", e.target.value)} className={inputClass}>
                {TRANSACTION_TYPES.map((t) => <option key={t}>{t}</option>)}
              </select>
            </Field>
            <Field label="Property Type">
              <select value={form.propertyType} onChange={(e) => set("propertyType", e.target.value)} className={inputClass}>
                {PROPERTY_TYPES.map((t) => <option key={t}>{t}</option>)}
              </select>
            </Field>
          </motion.div>

          <motion.div initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.27, duration: 0.3 }}>
            <Field label="Jurisdiction *" hint="State or county">
              <input type="text" value={form.jurisdiction} onChange={(e) => set("jurisdiction", e.target.value)} placeholder="e.g. Rockingham County, NH" className={inputClass} />
            </Field>
          </motion.div>

          <motion.div initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.33, duration: 0.3 }} className="grid grid-cols-2 gap-3">
            <Field label="Purchase/Sale Price">
              <input type="text" value={form.purchasePrice} onChange={(e) => set("purchasePrice", e.target.value)} placeholder="e.g. $425,000" className={inputClass} />
            </Field>
            <Field label="Complexity">
              <select value={form.complexity} onChange={(e) => set("complexity", e.target.value)} className={inputClass}>
                {COMPLEXITY_LEVELS.map((c) => <option key={c}>{c}</option>)}
              </select>
            </Field>
          </motion.div>

          <motion.div initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.39, duration: 0.3 }}>
            <Field label="Additional Services" hint="Optional">
              <textarea value={form.additionalServices} onChange={(e) => set("additionalServices", e.target.value)} placeholder="e.g. Entity formation, contract review, 1031 exchange coordination" rows={2} className={inputClass} />
            </Field>
          </motion.div>

          <motion.div initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.45, duration: 0.3 }} className="grid grid-cols-2 gap-3">
            <Field label="Attorney Name *">
              <input type="text" value={form.attorneyName} onChange={(e) => set("attorneyName", e.target.value)} placeholder="e.g. Sarah J. Collins, Esq." className={inputClass} />
            </Field>
            <Field label="Firm Name">
              <input type="text" value={form.firmName} onChange={(e) => set("firmName", e.target.value)} placeholder="e.g. Collins Law Group" className={inputClass} />
            </Field>
          </motion.div>

          <AnimatePresence>
            {error && (
              <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="text-sm text-red-500">
                {error}
              </motion.p>
            )}
          </AnimatePresence>

          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.51, duration: 0.3 }}>
            <ShimmerButton loading={loading} onClick={handleGenerate}>
              {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Generating...</> : "Generate Fee Estimate"}
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
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Fee Estimate Letter</h2>
            <AnimatePresence>
              {output && !loading && (
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="flex gap-2">
                  <button onClick={() => setOutput("")} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
                    <RotateCcw className="h-3.5 w-3.5" /> Clear
                  </button>
                  <button
                    onClick={handleCopy}
                    className={cn(
                      "flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-md transition-colors",
                      copied ? "bg-green-500/10 text-green-600" : "bg-primary/10 text-primary hover:bg-primary/20"
                    )}
                  >
                    {copied ? <><Check className="h-3.5 w-3.5" /> Copied</> : <><Copy className="h-3.5 w-3.5" /> Copy</>}
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {output ? (
            <AnimatePresence mode="wait">
              <motion.textarea
                key="output"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                value={output}
                onChange={(e) => setOutput(e.target.value)}
                className="flex-1 w-full text-sm text-foreground leading-relaxed resize-none border border-border rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent font-mono bg-muted/40"
                rows={24}
              />
            </AnimatePresence>
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
                  <p className="text-sm text-muted-foreground">Writing your estimate...</p>
                </div>
              ) : (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2 }}
                  className="flex flex-col items-center"
                >
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                    <DollarSign className="h-5 w-5 text-primary" />
                  </div>
                  <p className="text-sm font-medium text-foreground">Your fee estimate will appear here</p>
                  <p className="text-xs text-muted-foreground mt-1">Fill in details and click Generate</p>
                </motion.div>
              )}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  )
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
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

const inputClass = "w-full text-sm text-foreground bg-muted/40 border border-border rounded-lg px-3 py-2 placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
