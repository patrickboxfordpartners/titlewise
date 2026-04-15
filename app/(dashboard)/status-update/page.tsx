"use client"

import { useState } from "react"
import { Copy, Check, Loader2, RotateCcw } from "lucide-react"
import { cn } from "@/lib/utils"

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

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-slate-900">Status Update Generator</h1>
        <p className="text-sm text-slate-500 mt-1">
          Fill in the file details and get a professional client update email in seconds.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Form */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
          <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">File Details</h2>

          <Field label="Client Name *">
            <input
              type="text"
              value={form.clientName}
              onChange={(e) => set("clientName", e.target.value)}
              placeholder="e.g. John and Jane Smith"
              className={inputClass}
            />
          </Field>

          <Field label="Property Address *">
            <input
              type="text"
              value={form.propertyAddress}
              onChange={(e) => set("propertyAddress", e.target.value)}
              placeholder="e.g. 42 Maple Street, Portsmouth, NH 03801"
              className={inputClass}
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Transaction Type">
              <select
                value={form.transactionType}
                onChange={(e) => set("transactionType", e.target.value)}
                className={inputClass}
              >
                {TRANSACTION_TYPES.map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </Field>

            <Field label="Current Stage">
              <select
                value={form.closingStage}
                onChange={(e) => set("closingStage", e.target.value)}
                className={inputClass}
              >
                {CLOSING_STAGES.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </Field>
          </div>

          <Field label="Completed Items" hint="One per line">
            <textarea
              value={form.completedItems}
              onChange={(e) => set("completedItems", e.target.value)}
              placeholder={"Title search ordered\nHOA docs received\nInspection completed"}
              rows={3}
              className={inputClass}
            />
          </Field>

          <Field label="Outstanding Items" hint="One per line">
            <textarea
              value={form.outstandingItems}
              onChange={(e) => set("outstandingItems", e.target.value)}
              placeholder={"Lender to provide clear to close\nBuyer to provide proof of insurance"}
              rows={3}
              className={inputClass}
            />
          </Field>

          <Field label="Upcoming Deadlines">
            <input
              type="text"
              value={form.upcomingDeadlines}
              onChange={(e) => set("upcomingDeadlines", e.target.value)}
              placeholder="e.g. Closing scheduled for April 28"
              className={inputClass}
            />
          </Field>

          <Field label="Additional Notes">
            <textarea
              value={form.additionalNotes}
              onChange={(e) => set("additionalNotes", e.target.value)}
              placeholder="Anything else the client should know..."
              rows={2}
              className={inputClass}
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
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
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            onClick={handleGenerate}
            disabled={loading}
            className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              "Generate Update"
            )}
          </button>
        </div>

        {/* Output */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Generated Email</h2>
            {output && (
              <div className="flex gap-2">
                <button
                  onClick={() => setOutput("")}
                  className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-700 transition-colors"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  Clear
                </button>
                <button
                  onClick={handleCopy}
                  className={cn(
                    "flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-md transition-colors",
                    copied
                      ? "bg-green-50 text-green-700"
                      : "bg-blue-50 text-blue-700 hover:bg-blue-100"
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
              </div>
            )}
          </div>

          {output ? (
            <textarea
              value={output}
              onChange={(e) => setOutput(e.target.value)}
              className="flex-1 w-full text-sm text-slate-700 leading-relaxed resize-none border border-slate-200 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono"
              rows={24}
            />
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center border border-dashed border-slate-200 rounded-lg p-8 min-h-[400px]">
              {loading ? (
                <>
                  <Loader2 className="h-8 w-8 text-blue-400 animate-spin mb-3" />
                  <p className="text-sm text-slate-500">Writing your update...</p>
                </>
              ) : (
                <>
                  <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center mb-3">
                    <span className="text-slate-400 text-lg">✉</span>
                  </div>
                  <p className="text-sm font-medium text-slate-600">Your email will appear here</p>
                  <p className="text-xs text-slate-400 mt-1">Fill in the file details and click Generate</p>
                </>
              )}
            </div>
          )}
        </div>
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
        <label className="text-xs font-medium text-slate-600">{label}</label>
        {hint && <span className="text-xs text-slate-400">{hint}</span>}
      </div>
      {children}
    </div>
  )
}

const inputClass =
  "w-full text-sm text-slate-800 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
