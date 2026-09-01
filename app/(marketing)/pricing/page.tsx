"use client"

import Link from "next/link"
import { Check } from "lucide-react"
import { PLANS } from "@/lib/plans"
import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import LandingNav from "@/components/landing/LandingNav"
import LandingFooter from "@/components/landing/LandingFooter"

const planDetails = {
  solo: {
    inherits: null,
    features: [
      "1 attorney seat",
      "100 generations / month",
      "All 8 core tools",
      "State-specific checklists (7 states)",
      "PDF export on all tools",
      "Full-text search & date filters",
      "Document version history",
      "Email support",
    ],
  },
  small_firm: {
    inherits: "Solo",
    features: [
      "Up to 5 attorney seats",
      "500 generations / month",
      "Wire fraud institutional memory",
      "Client matter portal",
      "Team invitations & seat management",
      "Priority email support",
    ],
  },
  pro: {
    inherits: "Small Firm",
    features: [
      "Up to 10 attorney seats",
      "1,500 generations / month",
      "TRID compliance engine",
      "Autonomous closing agent",
      "Priority support",
    ],
  },
  enterprise: {
    inherits: "Pro",
    features: [
      "Up to 25 attorney seats",
      "5,000 generations / month",
      "API access",
      "Dedicated onboarding",
    ],
  },
}

export default function PricingPage() {
  const [annual, setAnnual] = useState(false)

  const entries = Object.entries(PLANS) as [keyof typeof PLANS, (typeof PLANS)[keyof typeof PLANS]][]

  return (
    <div className="min-h-screen bg-background">
      <LandingNav />

      <div className="container mx-auto px-6 pt-32 pb-20">
        <motion.div
          className="mx-auto mb-8 max-w-2xl text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-5xl font-light tracking-[-1.4px] text-foreground">Simple, predictable pricing</h1>
          <p className="mt-4 text-base font-light text-muted-foreground">
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
          <span className={`text-sm font-light transition-colors ${!annual ? "text-foreground" : "text-muted-foreground"}`}>
            Monthly
          </span>
          <button
            className={`relative h-7 w-12 rounded-full transition-colors duration-200 ${annual ? "bg-primary" : "bg-border"}`}
            onClick={() => setAnnual(!annual)}
            aria-label="Toggle annual billing"
          >
            <motion.div
              className="absolute top-0.5 h-6 w-6 rounded-full bg-background shadow-sm"
              animate={{ left: annual ? 22 : 2 }}
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
            />
          </button>
          <span className={`text-sm font-light transition-colors ${annual ? "text-foreground" : "text-muted-foreground"}`}>
            Annual
            <span className="ml-1 text-xs text-primary font-normal">-20%</span>
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
                className={`relative rounded-xl p-8 flex flex-col ${
                  isPopular ? "bg-[#0d253d] text-white shadow-md" : "bg-card text-foreground border border-border"
                }`}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 + 0.3, duration: 0.4 }}
                whileHover={{ y: -4, boxShadow: "0 8px 24px -8px rgba(0,55,112,0.08)" }}
              >
                {isPopular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-4 py-1 text-xs font-normal text-white">
                    Most Popular
                  </span>
                )}
                <h2 className="text-[22px] font-light tracking-[-0.22px]">{plan.name}</h2>
                <p className="mt-1 text-sm font-light">{plan.description}</p>
                <div className="mt-6 flex items-baseline gap-1">
                  <span className="text-sm" style={{ fontFeatureSettings: '"tnum"' }}>$</span>
                  <AnimatePresence mode="wait">
                    <motion.span
                      key={displayPrice}
                      className="text-[32px] font-light tracking-[-0.64px]"
                      style={{ fontFeatureSettings: '"tnum"' }}
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 8 }}
                      transition={{ duration: 0.2 }}
                    >
                      {displayPrice}
                    </motion.span>
                  </AnimatePresence>
                  <span className="text-sm" style={{ fontFeatureSettings: '"tnum"' }}>/month</span>
                </div>
                {annual && (
                  <motion.div
                    className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-normal text-primary"
                    style={{ fontFeatureSettings: '"tnum"' }}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.25 }}
                  >
                    Save ${(plan.price - displayPrice) * 12}/yr
                  </motion.div>
                )}

                <div className="mt-8">
                  {details.inherits && (
                    <p className={`text-sm font-light mb-4 ${isPopular ? "text-white/60" : "text-muted-foreground"}`}>
                      Everything in {details.inherits}, plus:
                    </p>
                  )}
                  <ul className="space-y-3">
                    {details.features.map((f) => (
                      <li key={f} className={`flex items-start gap-3 text-sm font-light ${isPopular ? "text-white" : "text-foreground"}`}>
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>

                <Link
                  href={`/sign-up?plan=${key}`}
                  className="mt-auto pt-8 block"
                >
                  <Button
                    variant="hero"
                    className={`w-full pointer-events-none ${isPopular ? "bg-primary hover:bg-primary/90 text-white" : "bg-primary hover:bg-primary/90 text-white"}`}
                    size="lg"
                  >
                    Get Started
                  </Button>
                </Link>
              </motion.div>
            )
          })}
        </div>

        {/* Cream band spacer */}
        <div className="w-full h-24" style={{ backgroundColor: "var(--surface)" }} />

        {/* FAQ */}
        <motion.div
          className="mx-auto mt-24 max-w-3xl"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1, duration: 0.5 }}
        >
          <h2 className="text-center text-[26px] font-light tracking-[-0.26px] text-foreground mb-2">
            Frequently Asked Questions
          </h2>
          <p className="text-center text-sm font-light text-muted-foreground mb-8">
            Everything you need to know about TITLEwise pricing.
          </p>

          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="trial">
              <AccordionTrigger className="text-sm font-light text-foreground">How do I get started?</AccordionTrigger>
              <AccordionContent className="text-sm font-light text-muted-foreground">
                Select a plan below and you'll be set up in minutes. Billing starts immediately when you subscribe. Monthly plans renew each month; annual plans renew once per year at a 20% discount.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="billing">
              <AccordionTrigger className="text-sm font-light text-foreground">When am I billed?</AccordionTrigger>
              <AccordionContent className="text-sm font-light text-muted-foreground">
                Billing starts when you select a plan. Monthly plans are billed on the same date each month. Annual plans are billed once per year upfront at a 20% discount.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="upgrade">
              <AccordionTrigger className="text-sm font-light text-foreground">Can I upgrade later?</AccordionTrigger>
              <AccordionContent className="text-sm font-light text-muted-foreground">
                Absolutely. You can upgrade at any time and the change takes effect immediately with a prorated charge. Start with Solo and move to Pro when you need the AI agent and TRID compliance — no data is lost.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="agent">
              <AccordionTrigger className="text-sm font-light text-foreground">What does the autonomous closing agent do?</AccordionTrigger>
              <AccordionContent className="text-sm font-light text-muted-foreground">
                The AI closing agent analyzes your entire matter, automatically updates checklist items, drafts status update emails, and flags potential issues. It runs from the matter detail page with one click. Available on Pro and Enterprise plans.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="portal">
              <AccordionTrigger className="text-sm font-light text-foreground">How does the client portal work?</AccordionTrigger>
              <AccordionContent className="text-sm font-light text-muted-foreground">
                Generate a shareable link for any matter. Your client can view checklist progress and closing status in real time without needing a TITLEwise account. Available on Small Firm, Pro, and Enterprise plans.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="cancel">
              <AccordionTrigger className="text-sm font-light text-foreground">What happens if I cancel?</AccordionTrigger>
              <AccordionContent className="text-sm font-light text-muted-foreground">
                You can cancel anytime with no penalties. You'll retain access through the end of your current billing period. Your data is kept for 30 days in case you decide to come back.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="seats">
              <AccordionTrigger className="text-sm font-light text-foreground">How do attorney seats work?</AccordionTrigger>
              <AccordionContent className="text-sm font-light text-muted-foreground">
                Each seat is a separate login for an attorney in your firm. Solo includes 1, Small Firm up to 5, Pro up to 10, and Enterprise up to 25. Team management with invitations is available on Small Firm and above. Need more seats? Contact us.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="security">
              <AccordionTrigger className="text-sm font-light text-foreground">Is my data secure?</AccordionTrigger>
              <AccordionContent className="text-sm font-light text-muted-foreground">
                Yes. All data is encrypted in transit and at rest. We never share or sell your data. TITLEwise is built with the security standards real estate attorneys expect.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </motion.div>
      </div>

      <LandingFooter />
    </div>
  )
}
