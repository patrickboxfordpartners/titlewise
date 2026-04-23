"use client"

import Link from "next/link"
import { useAuth } from "@clerk/nextjs"
import { Check, X, ArrowRight } from "lucide-react"
import { PLANS } from "@/lib/plans"
import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Logo } from "@/components/logo"

const planDetails = {
  solo: {
    features: [
      { text: "1 attorney seat", included: true },
      { text: "100 generations / month", included: true },
      { text: "All 8 core tools", included: true },
      { text: "State-specific checklists (7 states)", included: true },
      { text: "PDF export on all tools", included: true },
      { text: "Full-text search & date filters", included: true },
      { text: "Document version history", included: true },
      { text: "Email support", included: true },
      { text: "Wire fraud institutional memory", included: false },
      { text: "Client matter portal", included: false },
      { text: "TRID compliance engine", included: false },
      { text: "Autonomous closing agent", included: false },
    ],
  },
  small_firm: {
    features: [
      { text: "Up to 5 attorney seats", included: true },
      { text: "500 generations / month", included: true },
      { text: "All 8 core tools", included: true },
      { text: "State-specific checklists (7 states)", included: true },
      { text: "PDF export on all tools", included: true },
      { text: "Full-text search & date filters", included: true },
      { text: "Document version history", included: true },
      { text: "Wire fraud institutional memory", included: true },
      { text: "Client matter portal", included: true },
      { text: "Team invitations & seat management", included: true },
      { text: "Priority email support", included: true },
      { text: "TRID compliance engine", included: false },
      { text: "Autonomous closing agent", included: false },
    ],
  },
  pro: {
    features: [
      { text: "Up to 10 attorney seats", included: true },
      { text: "1,500 generations / month", included: true },
      { text: "All 8 core tools", included: true },
      { text: "State-specific checklists (7 states)", included: true },
      { text: "PDF export on all tools", included: true },
      { text: "Full-text search & date filters", included: true },
      { text: "Document version history", included: true },
      { text: "Wire fraud institutional memory", included: true },
      { text: "Client matter portal", included: true },
      { text: "Team invitations & seat management", included: true },
      { text: "TRID compliance engine", included: true },
      { text: "Autonomous closing agent", included: true },
      { text: "Priority support", included: true },
    ],
  },
  enterprise: {
    features: [
      { text: "Up to 25 attorney seats", included: true },
      { text: "5,000 generations / month", included: true },
      { text: "All 8 core tools", included: true },
      { text: "State-specific checklists (7 states)", included: true },
      { text: "PDF export on all tools", included: true },
      { text: "Full-text search & date filters", included: true },
      { text: "Document version history", included: true },
      { text: "Wire fraud institutional memory", included: true },
      { text: "Client matter portal", included: true },
      { text: "Team invitations & seat management", included: true },
      { text: "TRID compliance engine", included: true },
      { text: "Autonomous closing agent", included: true },
      { text: "API access", included: true },
      { text: "Dedicated onboarding", included: true },
      { text: "Priority support", included: true },
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
        body: JSON.stringify({ plan: planKey, annual }),
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
            Choose the plan that fits your practice. Scale up as you grow.
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
        <div className="mx-auto grid max-w-6xl gap-6 md:grid-cols-2 lg:grid-cols-4">
          {entries.map(([key, plan], i) => {
            const details = planDetails[key]
            const isPopular = key === "pro"
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
                    <li key={f.text} className={`flex items-start gap-3 text-sm ${f.included ? "text-foreground" : "text-muted-foreground/50"}`}>
                      {f.included ? (
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      ) : (
                        <X className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground/30" />
                      )}
                      {f.text}
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
                    {loading === key ? "Redirecting..." : <>Get Started {isPopular && <ArrowRight className="ml-1 h-4 w-4" />}</>}
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
                Select a plan below and you'll be set up in minutes. Billing starts immediately when you subscribe. Monthly plans renew each month; annual plans renew once per year at a 20% discount.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="billing">
              <AccordionTrigger className="text-sm font-medium text-foreground">When am I billed?</AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground">
                Billing starts when you select a plan. Monthly plans are billed on the same date each month. Annual plans are billed once per year upfront at a 20% discount.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="upgrade">
              <AccordionTrigger className="text-sm font-medium text-foreground">Can I upgrade later?</AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground">
                Absolutely. You can upgrade at any time and the change takes effect immediately with a prorated charge. Start with Solo and move to Pro when you need the AI agent and TRID compliance -- no data is lost.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="agent">
              <AccordionTrigger className="text-sm font-medium text-foreground">What does the autonomous closing agent do?</AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground">
                The AI closing agent analyzes your entire matter, automatically updates checklist items, drafts status update emails, and flags potential issues. It runs from the matter detail page with one click. Available on Pro and Enterprise plans.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="portal">
              <AccordionTrigger className="text-sm font-medium text-foreground">How does the client portal work?</AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground">
                Generate a shareable link for any matter. Your client can view checklist progress and closing status in real time without needing a TITLEwise account. Available on Small Firm, Pro, and Enterprise plans.
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
                Each seat is a separate login for an attorney in your firm. Solo includes 1, Small Firm up to 5, Pro up to 10, and Enterprise up to 25. Team management with invitations is available on Small Firm and above. Need more seats? Contact us.
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
