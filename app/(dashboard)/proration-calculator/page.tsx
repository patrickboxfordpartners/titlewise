"use client"

import { useState } from "react"
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
  const [periodStart, setPeriodStart] = useState("01-01") // MM-DD
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

    // Determine fiscal year period
    const [mm, dd] = periodStart.split("-").map(Number)
    let fyStart = new Date(year, mm - 1, dd)
    let fyEnd = new Date(year + 1, mm - 1, dd - 1)

    // If closing is before fiscal year start, use previous year's period
    if (closing < fyStart) {
      fyStart = new Date(year - 1, mm - 1, dd)
      fyEnd = new Date(year, mm - 1, dd - 1)
    }

    const daysInYear = Math.round((fyEnd.getTime() - fyStart.getTime()) / (1000 * 60 * 60 * 24)) + 1
    const dailyRate = tax / daysInYear

    // Seller owns through closing day (inclusive)
    const sellerDays = Math.round((closing.getTime() - fyStart.getTime()) / (1000 * 60 * 60 * 24)) + 1
    const buyerDays = daysInYear - sellerDays

    const sellerPortion = sellerDays * dailyRate
    const buyerPortion = buyerDays * dailyRate

    let sellerOwes = 0
    let buyerOwes = 0

    if (paidBy === "seller") {
      // Seller already paid full year — buyer owes seller for buyer's portion
      buyerOwes = buyerPortion
    } else if (paidBy === "buyer") {
      // Buyer will pay full year — seller owes buyer for seller's portion
      sellerOwes = sellerPortion
    } else {
      // Unpaid — seller owes their portion as credit to buyer
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
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-slate-900">Property Tax Proration</h1>
        <p className="text-sm text-slate-500 mt-1">
          Calculate buyer and seller tax prorations for closing.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
          <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Details</h2>

          <div>
            <label className="text-xs font-medium text-slate-600 block mb-1">Closing Date</label>
            <input
              type="date"
              value={closingDate}
              onChange={(e) => setClosingDate(e.target.value)}
              className={inputClass}
            />
          </div>

          <div>
            <label className="text-xs font-medium text-slate-600 block mb-1">Annual Property Tax</label>
            <input
              type="text"
              value={annualTax}
              onChange={(e) => setAnnualTax(e.target.value)}
              placeholder="e.g. 8,450.00"
              className={inputClass}
            />
          </div>

          <div>
            <label className="text-xs font-medium text-slate-600 block mb-1">Fiscal Year Starts</label>
            <select
              value={periodStart}
              onChange={(e) => setPeriodStart(e.target.value)}
              className={inputClass}
            >
              <option value="01-01">January 1 (Calendar Year)</option>
              <option value="07-01">July 1</option>
              <option value="04-01">April 1</option>
              <option value="10-01">October 1</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-medium text-slate-600 block mb-1">Taxes Paid By</label>
            <select
              value={paidBy}
              onChange={(e) => setPaidBy(e.target.value as "seller" | "buyer" | "unpaid")}
              className={inputClass}
            >
              <option value="unpaid">Not Yet Paid</option>
              <option value="seller">Seller (paid in advance)</option>
              <option value="buyer">Buyer (will pay at next bill)</option>
            </select>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            onClick={calculate}
            className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <Calculator className="h-4 w-4" />
            Calculate Proration
          </button>
        </div>

        {/* Result */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          {result ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Result</h2>
                <button
                  onClick={handleCopy}
                  className={cn(
                    "flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-md transition-colors",
                    copied ? "bg-green-50 text-green-700" : "bg-blue-50 text-blue-700 hover:bg-blue-100"
                  )}
                >
                  {copied ? <><Check className="h-3.5 w-3.5" /> Copied</> : <><Copy className="h-3.5 w-3.5" /> Copy</>}
                </button>
              </div>

              <div className="text-xs text-slate-500">
                {result.periodStart} – {result.periodEnd}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-50 rounded-lg p-3">
                  <div className="text-xs text-slate-500">Annual Tax</div>
                  <div className="text-lg font-bold text-slate-800">{fmt(result.annualTax)}</div>
                </div>
                <div className="bg-slate-50 rounded-lg p-3">
                  <div className="text-xs text-slate-500">Per Diem</div>
                  <div className="text-lg font-bold text-slate-800">{fmt(result.dailyRate)}</div>
                </div>
              </div>

              <div className="border-t border-slate-100 pt-3 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600">Seller ({result.sellerDays} days)</span>
                  <span className="font-semibold text-slate-800">{fmt(result.sellerDays * result.dailyRate)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600">Buyer ({result.buyerDays} days)</span>
                  <span className="font-semibold text-slate-800">{fmt(result.buyerDays * result.dailyRate)}</span>
                </div>
              </div>

              {(result.sellerOwes > 0 || result.buyerOwes > 0) && (
                <div className="border-t border-slate-100 pt-3">
                  {result.sellerOwes > 0 && (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                      <div className="text-xs font-semibold text-amber-700 uppercase">Seller Credit to Buyer</div>
                      <div className="text-xl font-bold text-amber-800">{fmt(result.sellerOwes)}</div>
                    </div>
                  )}
                  {result.buyerOwes > 0 && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <div className="text-xs font-semibold text-blue-700 uppercase">Buyer Credit to Seller</div>
                      <div className="text-xl font-bold text-blue-800">{fmt(result.buyerOwes)}</div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center text-center min-h-[300px]">
              <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center mb-3">
                <Calculator className="h-5 w-5 text-slate-400" />
              </div>
              <p className="text-sm font-medium text-slate-600">Proration will appear here</p>
              <p className="text-xs text-slate-400 mt-1">Enter closing details and calculate</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

const inputClass =
  "w-full text-sm text-slate-800 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
