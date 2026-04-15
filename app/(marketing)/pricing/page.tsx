"use client"

import Link from "next/link"
import { useAuth } from "@clerk/nextjs"
import { Check } from "lucide-react"
import { PLANS } from "@/lib/plans"
import { useState } from "react"

const planDetails = {
  solo: {
    features: [
      "1 attorney seat",
      "All 8 tools (Status Update, Title Analysis, CD Review, Wire Verification, HOA Review, Fee Estimate, Tax Proration, Checklists)",
      "History & re-generate",
      "PDF export",
      "Email support",
    ],
  },
  small_firm: {
    features: [
      "Up to 5 attorney seats",
      "All Solo features",
      "Shared history across firm",
      "Priority email support",
    ],
  },
  team: {
    features: [
      "Up to 15 attorney seats",
      "All Small Firm features",
      "API access",
      "Dedicated onboarding",
      "Priority support",
    ],
  },
}

export default function PricingPage() {
  const { isSignedIn } = useAuth()
  const [loading, setLoading] = useState<string | null>(null)

  async function handleSubscribe(planKey: string) {
    if (!isSignedIn) {
      window.location.href = "/sign-up"
      return
    }

    setLoading(planKey)
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: planKey }),
      })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        alert(data.error || "Something went wrong")
      }
    } catch {
      alert("Failed to start checkout")
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <header className="border-b border-slate-100">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link href="/">
            <img src="/logo.svg" alt="TitleWise" className="h-9 w-auto" />
          </Link>
          <Link href="/sign-up" className="text-sm bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-lg transition-colors">
            Get Started
          </Link>
        </div>
      </header>

      <section className="max-w-5xl mx-auto px-6 py-16 text-center">
        <h1 className="text-3xl font-bold text-slate-900 mb-3">Simple, predictable pricing</h1>
        <p className="text-slate-500 text-sm mb-10">
          All plans include a 14-day free trial. No credit card required to start.
        </p>

        <div className="grid md:grid-cols-3 gap-5">
          {(Object.entries(PLANS) as [keyof typeof PLANS, (typeof PLANS)[keyof typeof PLANS]][]).map(
            ([key, plan]) => {
              const details = planDetails[key]
              const isPopular = key === "small_firm"
              return (
                <div
                  key={key}
                  className={`rounded-2xl border p-6 text-left relative ${
                    isPopular
                      ? "border-blue-500 shadow-md shadow-blue-100"
                      : "border-slate-200"
                  }`}
                >
                  {isPopular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className="bg-blue-600 text-white text-xs font-medium px-3 py-1 rounded-full">
                        Most Popular
                      </span>
                    </div>
                  )}
                  <div className="mb-5">
                    <h2 className="text-base font-semibold text-slate-900">{plan.name}</h2>
                    <p className="text-sm text-slate-500 mt-0.5">{plan.description}</p>
                    <div className="mt-3 flex items-baseline gap-1">
                      <span className="text-3xl font-bold text-slate-900">${plan.price}</span>
                      <span className="text-sm text-slate-400">/month</span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">Save 20% billed annually</p>
                  </div>

                  <ul className="space-y-2.5 mb-6">
                    {details.features.map((f) => (
                      <li key={f} className="flex items-start gap-2.5 text-sm text-slate-600">
                        <Check className="h-4 w-4 text-blue-500 mt-0.5 shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>

                  <button
                    onClick={() => handleSubscribe(key)}
                    disabled={loading === key}
                    className={`block w-full py-2.5 rounded-lg text-sm font-medium text-center transition-colors ${
                      isPopular
                        ? "bg-blue-600 hover:bg-blue-700 text-white disabled:bg-blue-400"
                        : "border border-slate-200 hover:border-slate-300 text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                    }`}
                  >
                    {loading === key ? "Redirecting..." : "Start Free Trial"}
                  </button>
                </div>
              )
            }
          )}
        </div>
      </section>
    </div>
  )
}
