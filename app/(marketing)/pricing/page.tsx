import Link from "next/link"
import { Check } from "lucide-react"
import { PLANS } from "@/lib/plans"

const planDetails = {
  solo: {
    features: [
      "1 attorney seat",
      "Status Update Generator",
      "Title Commitment Analyzer (coming soon)",
      "Email support",
    ],
  },
  small_firm: {
    features: [
      "Up to 5 attorney seats",
      "All Solo features",
      "Team shared history",
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
  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <header className="border-b border-slate-100">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link href="/" className="text-base font-semibold text-slate-900 tracking-tight">
            TitleWise
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

                  <Link
                    href="/sign-up"
                    className={`block w-full py-2.5 rounded-lg text-sm font-medium text-center transition-colors ${
                      isPopular
                        ? "bg-blue-600 hover:bg-blue-700 text-white"
                        : "border border-slate-200 hover:border-slate-300 text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    Start Free Trial
                  </Link>
                </div>
              )
            }
          )}
        </div>
      </section>
    </div>
  )
}
