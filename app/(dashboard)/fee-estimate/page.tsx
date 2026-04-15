"use client"

import { useState } from "react"
import { Copy, Check, Loader2, RotateCcw } from "lucide-react"
import { cn } from "@/lib/utils"

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
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-slate-900">Fee Estimate Generator</h1>
        <p className="text-sm text-slate-500 mt-1">
          Generate a professional fee estimate letter for new client intake.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Form */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
          <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Transaction Details</h2>

          <Field label="Client Name *">
            <input type="text" value={form.clientName} onChange={(e) => set("clientName", e.target.value)} placeholder="e.g. John and Jane Smith" className={inputClass} />
          </Field>

          <div className="grid grid-cols-2 gap-3">
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
          </div>

          <Field label="Jurisdiction *" hint="State or county">
            <input type="text" value={form.jurisdiction} onChange={(e) => set("jurisdiction", e.target.value)} placeholder="e.g. Rockingham County, NH" className={inputClass} />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Purchase/Sale Price">
              <input type="text" value={form.purchasePrice} onChange={(e) => set("purchasePrice", e.target.value)} placeholder="e.g. $425,000" className={inputClass} />
            </Field>
            <Field label="Complexity">
              <select value={form.complexity} onChange={(e) => set("complexity", e.target.value)} className={inputClass}>
                {COMPLEXITY_LEVELS.map((c) => <option key={c}>{c}</option>)}
              </select>
            </Field>
          </div>

          <Field label="Additional Services" hint="Optional">
            <textarea value={form.additionalServices} onChange={(e) => set("additionalServices", e.target.value)} placeholder="e.g. Entity formation, contract review, 1031 exchange coordination" rows={2} className={inputClass} />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Attorney Name *">
              <input type="text" value={form.attorneyName} onChange={(e) => set("attorneyName", e.target.value)} placeholder="e.g. Sarah J. Collins, Esq." className={inputClass} />
            </Field>
            <Field label="Firm Name">
              <input type="text" value={form.firmName} onChange={(e) => set("firmName", e.target.value)} placeholder="e.g. Collins Law Group" className={inputClass} />
            </Field>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button onClick={handleGenerate} disabled={loading} className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2">
            {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Generating...</> : "Generate Fee Estimate"}
          </button>
        </div>

        {/* Output */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Fee Estimate Letter</h2>
            {output && (
              <div className="flex gap-2">
                <button onClick={() => setOutput("")} className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-700 transition-colors">
                  <RotateCcw className="h-3.5 w-3.5" /> Clear
                </button>
                <button onClick={handleCopy} className={cn("flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-md transition-colors", copied ? "bg-green-50 text-green-700" : "bg-blue-50 text-blue-700 hover:bg-blue-100")}>
                  {copied ? <><Check className="h-3.5 w-3.5" /> Copied</> : <><Copy className="h-3.5 w-3.5" /> Copy</>}
                </button>
              </div>
            )}
          </div>

          {output ? (
            <textarea value={output} onChange={(e) => setOutput(e.target.value)} className="flex-1 w-full text-sm text-slate-700 leading-relaxed resize-none border border-slate-200 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono" rows={24} />
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center border border-dashed border-slate-200 rounded-lg p-8 min-h-[400px]">
              {loading ? (
                <><Loader2 className="h-8 w-8 text-blue-400 animate-spin mb-3" /><p className="text-sm text-slate-500">Writing your estimate...</p></>
              ) : (
                <><div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center mb-3"><span className="text-slate-400 text-lg">$</span></div><p className="text-sm font-medium text-slate-600">Your fee estimate will appear here</p><p className="text-xs text-slate-400 mt-1">Fill in details and click Generate</p></>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-baseline justify-between mb-1">
        <label className="text-xs font-medium text-slate-600">{label}</label>
        {hint && <span className="text-xs text-slate-400">{hint}</span>}
      </div>
      {children}
    </div>
  )
}

const inputClass = "w-full text-sm text-slate-800 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
