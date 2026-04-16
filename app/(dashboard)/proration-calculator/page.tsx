"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Calculator, Copy, Check } from "lucide-react"
import { cn } from "@/lib/utils"

type Result = {
  annualTax: number
  dailyRate: number
  daysInYear: number
  sellerDays: number
  buyerDays: number
  sellerOwes: number
  buyerOwes: number
  closingDate: string
  periodStart: string
  periodEnd: string
  paidBy: string
}

export default function ProrationCalculatorPage() {
  const [closingDate, setClosingDate] = useState("")
  const [annualTax, setAnnualTax] = useState("")
  const [periodStart, setPeriodStart] = useState("01-01")
  const [paidBy, setPaidBy] = useState<"seller" | "buyer" | "unpaid">("unpaid")
  const [result, setResult] = useState<Result | null>(null)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState("")

  function calculate() {
    setError("")
    setResult(null)

    if (!closingDate || !annualTax) {
      setError("Closing date and annual tax amount are required.")
      return
    }

    const tax = parseFloat(annualTax.replace(/[,$]/g, ""))
    if (isNaN(tax) || tax <= 0) {
      setError("Enter a valid annual tax amount.")
      return
    }

    const closing = new Date(closingDate + "T12:00:00")
    const year = closing.getFullYear()

    const [mm, dd] = periodStart.split("-").map(Number)
    let fyStart = new Date(year, mm - 1, dd)
    let fyEnd = new Date(year + 1, mm - 1, dd - 1)

    if (closing < fyStart) {
      fyStart = new Date(year - 1, mm - 1, dd)
      fyEnd = new Date(year, mm - 1, dd - 1)
    }

    const daysInYear = Math.round((fyEnd.getTime() - fyStart.getTime()) / (1000 * 60 * 60 * 24)) + 1
    const dailyRate = tax / daysInYear

    const sellerDays = Math.round((closing.getTime() - fyStart.getTime()) / (1000 * 60 * 60 * 24)) + 1
    const buyerDays = daysInYear - sellerDays

    const sellerPortion = sellerDays * dailyRate
    const buyerPortion = buyerDays * dailyRate

    let sellerOwes = 0
    let buyerOwes = 0

    if (paidBy === "seller") {
      buyerOwes = buyerPortion
    } else if (paidBy === "buyer") {
      sellerOwes = sellerPortion
    } else {
      sellerOwes = sellerPortion
    }

    setResult({
      annualTax: tax,
      dailyRate,
      daysInYear,
      sellerDays,
      buyerDays,
      sellerOwes,
      buyerOwes,
      closingDate: closing.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }),
      periodStart: fyStart.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }),
      periodEnd: fyEnd.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }),
      paidBy,
    })
  }

  function fmt(n: number) {
    return n.toLocaleString("en-US", { style: "currency", currency: "USD" })
  }

  async function handleCopy() {
    if (!result) return
    const text = [
      `Property Tax Proration — ${result.closingDate}`,
      ``,
      `Tax Period: ${result.periodStart} – ${result.periodEnd}`,
      `Annual Tax: ${fmt(result.annualTax)}`,
      `Per Diem: ${fmt(result.dailyRate)}`,
      ``,
      `Seller: ${result.sellerDays} days = ${fmt(result.sellerDays * result.dailyRate)}`,
      `Buyer: ${result.buyerDays} days = ${fmt(result.buyerDays * result.dailyRate)}`,
      ``,
      result.sellerOwes > 0 ? `Seller credit to buyer: ${fmt(result.sellerOwes)}` : "",
      result.buyerOwes > 0 ? `Buyer credit to seller: ${fmt(result.buyerOwes)}` : "",
    ].filter(Boolean).join("\n")

    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mb-6"
      >
        <h1 className="text-2xl font-semibold text-foreground">Property Tax Proration</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Calculate buyer and seller tax prorations for closing.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.4 }}
          className="bg-card rounded-xl border border-border p-5 space-y-4"
        >
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Details</h2>

          {[
            { label: "Closing Date", key: "closingDate", type: "date" as const, value: closingDate, onChange: setClosingDate, placeholder: undefined },
            { label: "Annual Property Tax", key: "annualTax", type: "text" as const, value: annualTax, onChange: setAnnualTax, placeholder: "e.g. 8,450.00" },
          ].map(({ label, key, type, value, onChange, placeholder }, i) => (
            <motion.div
              key={key}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.15 + i * 0.08, duration: 0.3 }}
            >
              <label className="text-xs font-medium text-muted-foreground block mb-1">{label}</label>
              <input
                type={type}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                className={inputClass}
              />
            </motion.div>
          ))}

          <motion.div initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.31, duration: 0.3 }}>
            <label className="text-xs font-medium text-muted-foreground block mb-1">Fiscal Year Starts</label>
            <select value={periodStart} onChange={(e) => setPeriodStart(e.target.value)} className={inputClass}>
              <option value="01-01">January 1 (Calendar Year)</option>
              <option value="07-01">July 1</option>
              <option value="04-01">April 1</option>
              <option value="10-01">October 1</option>
            </select>
          </motion.div>

          <motion.div initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.39, duration: 0.3 }}>
            <label className="text-xs font-medium text-muted-foreground block mb-1">Taxes Paid By</label>
            <select value={paidBy} onChange={(e) => setPaidBy(e.target.value as "seller" | "buyer" | "unpaid")} className={inputClass}>
              <option value="unpaid">Not Yet Paid</option>
              <option value="seller">Seller (paid in advance)</option>
              <option value="buyer">Buyer (will pay at next bill)</option>
            </select>
          </motion.div>

          <AnimatePresence>
            {error && (
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-sm text-red-500">
                {error}
              </motion.p>
            )}
          </AnimatePresence>

          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.47, duration: 0.3 }}>
            <button
              onClick={calculate}
              className="relative overflow-hidden w-full py-2.5 px-4 bg-primary hover:bg-primary/90 text-white text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <Calculator className="h-4 w-4" />
              Calculate Proration
            </button>
          </motion.div>
        </motion.div>

        {/* Result */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.4 }}
          className="bg-card rounded-xl border border-border p-5"
        >
          <AnimatePresence mode="wait">
            {result ? (
              <motion.div
                key="result"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.3 }}
                className="space-y-4"
              >
                <div className="flex items-center justify-between">
                  <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Result</h2>
                  <button
                    onClick={handleCopy}
                    className={cn(
                      "flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-md transition-colors",
                      copied ? "bg-green-500/10 text-green-600" : "bg-primary/10 text-primary hover:bg-primary/20"
                    )}
                  >
                    {copied ? <><Check className="h-3.5 w-3.5" /> Copied</> : <><Copy className="h-3.5 w-3.5" /> Copy</>}
                  </button>
                </div>

                <div className="text-xs text-muted-foreground">
                  {result.periodStart} – {result.periodEnd}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: "Annual Tax", value: fmt(result.annualTax) },
                    { label: "Per Diem", value: fmt(result.dailyRate) },
                  ].map((item, i) => (
                    <motion.div
                      key={item.label}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.07, type: "spring", stiffness: 300, damping: 25 }}
                      className="bg-muted/40 rounded-lg p-3 border border-border"
                    >
                      <div className="text-xs text-muted-foreground">{item.label}</div>
                      <div className="text-lg font-bold text-foreground">{item.value}</div>
                    </motion.div>
                  ))}
                </div>

                <div className="border-t border-border pt-3 space-y-2">
                  {[
                    { label: `Seller (${result.sellerDays} days)`, value: fmt(result.sellerDays * result.dailyRate) },
                    { label: `Buyer (${result.buyerDays} days)`, value: fmt(result.buyerDays * result.dailyRate) },
                  ].map((item, i) => (
                    <motion.div
                      key={item.label}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 + i * 0.06 }}
                      className="flex items-center justify-between text-sm"
                    >
                      <span className="text-muted-foreground">{item.label}</span>
                      <span className="font-semibold text-foreground">{item.value}</span>
                    </motion.div>
                  ))}
                </div>

                {(result.sellerOwes > 0 || result.buyerOwes > 0) && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.25, type: "spring", stiffness: 300, damping: 25 }}
                    className="border-t border-border pt-3 space-y-2"
                  >
                    {result.sellerOwes > 0 && (
                      <div className="bg-amber-500/8 border border-amber-500/20 rounded-lg p-3">
                        <div className="text-xs font-semibold text-amber-600 uppercase">Seller Credit to Buyer</div>
                        <div className="text-xl font-bold text-amber-700">{fmt(result.sellerOwes)}</div>
                      </div>
                    )}
                    {result.buyerOwes > 0 && (
                      <div className="bg-primary/8 border border-primary/20 rounded-lg p-3">
                        <div className="text-xs font-semibold text-primary uppercase">Buyer Credit to Seller</div>
                        <div className="text-xl font-bold text-primary">{fmt(result.buyerOwes)}</div>
                      </div>
                    )}
                  </motion.div>
                )}
              </motion.div>
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center text-center min-h-[300px]"
              >
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                  <Calculator className="h-5 w-5 text-primary" />
                </div>
                <p className="text-sm font-medium text-foreground">Proration will appear here</p>
                <p className="text-xs text-muted-foreground mt-1">Enter closing details and calculate</p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  )
}

const inputClass =
  "w-full text-sm text-foreground bg-muted/40 border border-border rounded-lg px-3 py-2 placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
