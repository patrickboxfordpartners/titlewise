"use client"

import Link from "next/link"
import { Check, X } from "lucide-react"
import { PLANS } from "@/lib/plans"
import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import LandingNav from "@/components/landing/LandingNav"
import LandingFooter from "@/components/landing/LandingFooter"

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
  const [annual, setAnnual] = useState(false)

  const entries = Object.entries(PLANS) as [keyof typeof PLANS, (typeof PLANS)[keyof typeof PLANS]][]

  return (
    <div className="min-h-screen bg-white">
      <LandingNav />

      <div className="container mx-auto px-6 pt-32 pb-20">
        <motion.div
          className="mx-auto mb-8 max-w-2xl text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-5xl font-light tracking-[-1.4px] text-[#0d253d]">Simple, predictable pricing</h1>
          <p className="mt-4 text-base font-light text-[#64748d]">
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
          <span className={`text-sm font-light transition-colors ${!annual ? "text-[#0d253d]" : "text-[#64748d]"}`}>
            Monthly
          </span>
          <button
            className={`relative h-7 w-12 rounded-full transition-colors duration-200 ${annual ? "bg-[#0066cc]" : "bg-[#e3e8ee]"}`}
            onClick={() => setAnnual(!annual)}
            aria-label="Toggle annual billing"
          >
            <motion.div
              className="absolute top-0.5 h-6 w-6 rounded-full bg-white shadow-sm"
              animate={{ left: annual ? 22 : 2 }}
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
            />
          </button>
          <span className={`text-sm font-light transition-colors ${annual ? "text-[#0d253d]" : "text-[#64748d]"}`}>
            Annual
            <span className="ml-1 text-xs text-[#0066cc] font-normal">-20%</span>
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
                className={`relative rounded-xl p-8 ${
                  isPopular ? "bg-[#0d253d] text-white shadow-md" : "bg-white text-[#0d253d] border border-[#e3e8ee]"
                }`}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 + 0.3, duration: 0.4 }}
                whileHover={{ y: -4, boxShadow: "0 8px 24px -8px rgba(0,55,112,0.08)" }}
              >
                {isPopular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-[#0066cc] px-4 py-1 text-xs font-normal text-white">
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
                    className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-[#e3f2fd] px-3 py-1 text-xs font-normal text-[#0052a3]"
                    style={{ fontFeatureSettings: '"tnum"' }}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.25 }}
                  >
                    Save ${(plan.price - displayPrice) * 12}/yr
                  </motion.div>
                )}

                <ul className="mt-8 space-y-3">
                  {details.features.map((f) => (
                    <li key={f.text} className={`flex items-start gap-3 text-sm font-light ${f.included ? (isPopular ? "text-white" : "text-[#0d253d]") : "opacity-40"}`}>
                      {f.included ? (
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#0066cc]" />
                      ) : (
                        <X className="mt-0.5 h-4 w-4 shrink-0 opacity-30" />
                      )}
                      {f.text}
                    </li>
                  ))}
                </ul>

                <Link
                  href={`/sign-up?plan=${key}`}
                  className="mt-8 block"
                >
                  <Button
                    variant="hero"
                    className={`w-full pointer-events-none ${isPopular ? "bg-[#0066cc] hover:bg-[#0052a3] text-white" : "bg-[#0066cc] hover:bg-[#0052a3] text-white"}`}
                    size="lg"
                  >
                    {key === "solo" ? "Start 7-Day Free Trial" : "Get Started"}
                  </Button>
                </Link>
              </motion.div>
            )
          })}
        </div>

        {/* Cream band spacer */}
        <div className="w-full h-24" style={{ backgroundColor: "#f6f9fc" }} />

        {/* FAQ */}
        <motion.div
          className="mx-auto mt-24 max-w-3xl"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1, duration: 0.5 }}
        >
          <h2 className="text-center text-[26px] font-light tracking-[-0.26px] text-[#0d253d] mb-2">
            Frequently Asked Questions
          </h2>
          <p className="text-center text-sm font-light text-[#64748d] mb-8">
            Everything you need to know about TitleWise pricing.
          </p>

          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="trial">
              <AccordionTrigger className="text-sm font-light text-[#0d253d]">How do I get started?</AccordionTrigger>
              <AccordionContent className="text-sm font-light text-[#64748d]">
                Select a plan below and you'll be set up in minutes. Billing starts immediately when you subscribe. Monthly plans renew each month; annual plans renew once per year at a 20% discount.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="billing">
              <AccordionTrigger className="text-sm font-light text-[#0d253d]">When am I billed?</AccordionTrigger>
              <AccordionContent className="text-sm font-light text-[#64748d]">
                Billing starts when you select a plan. Monthly plans are billed on the same date each month. Annual plans are billed once per year upfront at a 20% discount.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="upgrade">
              <AccordionTrigger className="text-sm font-light text-[#0d253d]">Can I upgrade later?</AccordionTrigger>
              <AccordionContent className="text-sm font-light text-[#64748d]">
                Absolutely. You can upgrade at any time and the change takes effect immediately with a prorated charge. Start with Solo and move to Pro when you need the AI agent and TRID compliance — no data is lost.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="agent">
              <AccordionTrigger className="text-sm font-light text-[#0d253d]">What does the autonomous closing agent do?</AccordionTrigger>
              <AccordionContent className="text-sm font-light text-[#64748d]">
                The AI closing agent analyzes your entire matter, automatically updates checklist items, drafts status update emails, and flags potential issues. It runs from the matter detail page with one click. Available on Pro and Enterprise plans.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="portal">
              <AccordionTrigger className="text-sm font-light text-[#0d253d]">How does the client portal work?</AccordionTrigger>
              <AccordionContent className="text-sm font-light text-[#64748d]">
                Generate a shareable link for any matter. Your client can view checklist progress and closing status in real time without needing a TITLEwise account. Available on Small Firm, Pro, and Enterprise plans.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="cancel">
              <AccordionTrigger className="text-sm font-light text-[#0d253d]">What happens if I cancel?</AccordionTrigger>
              <AccordionContent className="text-sm font-light text-[#64748d]">
                You can cancel anytime with no penalties. You'll retain access through the end of your current billing period. Your data is kept for 30 days in case you decide to come back.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="seats">
              <AccordionTrigger className="text-sm font-light text-[#0d253d]">How do attorney seats work?</AccordionTrigger>
              <AccordionContent className="text-sm font-light text-[#64748d]">
                Each seat is a separate login for an attorney in your firm. Solo includes 1, Small Firm up to 5, Pro up to 10, and Enterprise up to 25. Team management with invitations is available on Small Firm and above. Need more seats? Contact us.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="security">
              <AccordionTrigger className="text-sm font-light text-[#0d253d]">Is my data secure?</AccordionTrigger>
              <AccordionContent className="text-sm font-light text-[#64748d]">
                Yes. All data is encrypted in transit and at rest. We never share or sell your data. TitleWise is built with the security standards real estate attorneys expect.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </motion.div>
      </div>

      <LandingFooter />
    </div>
  )
}
