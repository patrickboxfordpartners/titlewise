"use client"

import Link from "next/link"
import { useAuth } from "@clerk/nextjs"
import { Check, ArrowRight } from "lucide-react"
import { PLANS } from "@/lib/plans"
import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Logo } from "@/components/logo"

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
  const [annual, setAnnual] = useState(false)

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

  const entries = Object.entries(PLANS) as [keyof typeof PLANS, (typeof PLANS)[keyof typeof PLANS]][]

  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="border-b border-border bg-background">
        <div className="container mx-auto flex h-16 items-center justify-between px-6">
          <Logo href="/" />
          <Link href="/sign-up">
            <Button size="sm">Get Started</Button>
          </Link>
        </div>
      </nav>

      <div className="container mx-auto px-6 py-20">
        <motion.div
          className="mx-auto mb-8 max-w-2xl text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-4xl font-bold text-foreground tracking-tight">Simple, predictable pricing</h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Choose the plan that fits your practice. No credit card required to start.
          </p>
        </motion.div>

        {/* Annual toggle */}
        <motion.div
          className="mx-auto mb-12 flex items-center justify-center gap-3"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.4 }}
        >
          <span className={`text-sm font-medium transition-colors ${!annual ? "text-foreground" : "text-muted-foreground"}`}>
            Monthly
          </span>
          <button
            className={`relative h-7 w-12 rounded-full transition-colors duration-200 ${annual ? "bg-primary" : "bg-muted"}`}
            onClick={() => setAnnual(!annual)}
            aria-label="Toggle annual billing"
          >
            <motion.div
              className="absolute top-0.5 h-6 w-6 rounded-full bg-white shadow-sm"
              animate={{ left: annual ? 22 : 2 }}
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
            />
          </button>
          <span className={`text-sm font-medium transition-colors ${annual ? "text-foreground" : "text-muted-foreground"}`}>
            Annual
            <span className="ml-1 text-xs text-primary font-semibold">-20%</span>
          </span>
        </motion.div>

        {/* Plans */}
        <div className="mx-auto grid max-w-5xl gap-8 md:grid-cols-3">
          {entries.map(([key, plan], i) => {
            const details = planDetails[key]
            const isPopular = key === "small_firm"
            const displayPrice = annual ? Math.round(plan.price * 0.8) : plan.price
            return (
              <motion.div
                key={key}
                className={`relative rounded-xl border bg-card p-8 ${
                  isPopular ? "border-primary shadow-md" : "border-border"
                }`}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 + 0.3, duration: 0.4 }}
                whileHover={{ y: -4, boxShadow: "0 8px 24px -8px hsl(222 47% 11% / 0.1)" }}
              >
                {isPopular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-4 py-1 text-xs font-semibold text-primary-foreground">
                    Most Popular
                  </span>
                )}
                <h2 className="text-2xl font-bold text-foreground">{plan.name}</h2>
                <p className="mt-1 text-sm text-muted-foreground">{plan.description}</p>
                <div className="mt-6 flex items-baseline gap-1">
                  <span className="text-sm text-muted-foreground">$</span>
                  <AnimatePresence mode="wait">
                    <motion.span
                      key={displayPrice}
                      className="text-4xl font-bold text-foreground"
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 8 }}
                      transition={{ duration: 0.2 }}
                    >
                      {displayPrice}
                    </motion.span>
                  </AnimatePresence>
                  <span className="text-sm text-muted-foreground">/month</span>
                </div>
                {annual && (
                  <motion.div
                    className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.25 }}
                  >
                    Save ${(plan.price - displayPrice) * 12}/yr
                  </motion.div>
                )}

                <ul className="mt-8 space-y-3">
                  {details.features.map((f) => (
                    <li key={f} className="flex items-start gap-3 text-sm text-foreground">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      {f}
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => handleSubscribe(key)}
                  disabled={loading === key}
                  className="mt-8 w-full"
                >
                  <Button
                    variant={isPopular ? "hero" : "outline"}
                    className="w-full pointer-events-none"
                    size="lg"
                    disabled={loading === key}
                  >
                    {loading === key ? "Redirecting..." : <>Start Free Trial {isPopular && <ArrowRight className="ml-1 h-4 w-4" />}</>}
                  </Button>
                </button>
              </motion.div>
            )
          })}
        </div>

        {/* FAQ */}
        <motion.div
          className="mx-auto mt-24 max-w-3xl"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1, duration: 0.5 }}
        >
          <h2 className="text-center text-2xl font-bold text-foreground tracking-tight mb-2">
            Frequently Asked Questions
          </h2>
          <p className="text-center text-sm text-muted-foreground mb-8">
            Everything you need to know about TITLEwise pricing.
          </p>

          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="trial">
              <AccordionTrigger className="text-sm font-medium text-foreground">How do I get started?</AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground">
                Sign up and get instant access to all 8 tools. No credit card required. Explore at your own pace and choose a plan when you're ready.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="billing">
              <AccordionTrigger className="text-sm font-medium text-foreground">When am I billed?</AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground">
                Billing starts when you select a plan. Monthly plans are billed on the same date each month. Annual plans are billed once per year upfront at a 20% discount.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="switch">
              <AccordionTrigger className="text-sm font-medium text-foreground">Can I switch plans later?</AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground">
                Absolutely. You can upgrade or downgrade at any time. Upgrades take effect immediately with a prorated charge; downgrades apply at the next billing cycle.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="cancel">
              <AccordionTrigger className="text-sm font-medium text-foreground">What happens if I cancel?</AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground">
                You can cancel anytime with no penalties. You'll retain access through the end of your current billing period. Your data is kept for 30 days in case you decide to come back.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="seats">
              <AccordionTrigger className="text-sm font-medium text-foreground">How do attorney seats work?</AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground">
                Each seat is a separate login for an attorney in your firm. The Solo plan includes 1 seat, Small Firm up to 5, and Team up to 15. Need more? Contact us for a custom plan.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="security">
              <AccordionTrigger className="text-sm font-medium text-foreground">Is my data secure?</AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground">
                Yes. All data is encrypted in transit and at rest. We never share or sell your data. TITLEwise is built with the security standards real estate attorneys expect.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </motion.div>
      </div>
    </div>
  )
}
