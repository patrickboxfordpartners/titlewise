"use client"

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { motion } from "framer-motion"

const faqs = [
  {
    value: "what",
    question: "What is TitleWise?",
    answer: "TitleWise is an AI-powered closing platform built specifically for real estate attorneys. It combines 12 document analysis tools, an autonomous closing coordinator agent, client portals, TRID compliance checks, and wire fraud protection—so you can close faster with fewer errors.",
  },
  {
    value: "security",
    question: "Is my data secure?",
    answer: "Absolutely. All data is encrypted in transit and at rest. We never share or sell your information. TitleWise is built with the security and confidentiality standards real estate attorneys expect.",
  },
  {
    value: "tools",
    question: "Which tools are included?",
    answer: "Every plan includes 8 core tools: Status Update Generator, Title Commitment Analyzer, Closing Disclosure Reviewer, Wire Fraud Prevention, HOA Document Reviewer, Fee Estimate Generator, Tax Proration Calculator, and state-specific Closing Checklist Tracker. Higher plans add the Autonomous Closing Agent, Client Matter Portal, TRID Compliance Engine, and Wire Fraud Memory—12 tools total.",
  },
  {
    value: "agent",
    question: "What does the AI closing agent do?",
    answer: "The autonomous closing coordinator analyzes your entire matter, auto-updates checklist items as they're completed, drafts status update emails, and flags potential issues—all without you lifting a finger. It's available on Pro and Enterprise plans.",
  },
  {
    value: "portal",
    question: "How does the client portal work?",
    answer: "Share a secure link with your client and they can track checklist progress, closing status, and key milestones in real time. No login required for clients—just a unique, secure URL. Available on Small Firm plans and above.",
  },
  {
    value: "states",
    question: "Which states are supported?",
    answer: "TitleWise includes state-specific checklist templates for NH, MA, NY, CA, FL, TX, and PA, with more states being added regularly. The document analysis tools work with closings in all 50 states.",
  },
  {
    value: "integration",
    question: "Does it integrate with my existing workflow?",
    answer: "Yes. TitleWise works alongside your current tools. Upload documents in standard formats (PDF, DOCX), review AI-generated insights, and export results as polished PDFs ready for clients or co-counsel.",
  },
  {
    value: "cancel",
    question: "Can I cancel anytime?",
    answer: "Yes. There are no long-term contracts or cancellation fees. You can cancel at any time, and you'll retain access through the end of your current billing period.",
  },
]

export default function FAQSectionUpgraded() {
  return (
    <section className="bg-section-accent py-16 md:py-20">
      <div className="container mx-auto px-6">
        {/* Symmetric 50/50 layout */}
        <div className="mx-auto grid max-w-6xl lg:grid-cols-2 gap-12 items-start">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.01 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="lg:sticky lg:top-32"
          >
            <h2 className="text-4xl font-bold text-foreground tracking-tighter md:text-5xl">
              Frequently Asked Questions
            </h2>
            <p className="mt-5 text-base text-muted-foreground leading-relaxed max-w-[40ch]">
              Everything you need to know about TitleWise.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.01 }}
            transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          >
            <Accordion type="single" collapsible className="w-full">
              {faqs.map((faq, i) => (
                <motion.div
                  key={faq.value}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.01 }}
                  transition={{ delay: i * 0.05 + 0.2, duration: 0.4 }}
                >
                  <AccordionItem value={faq.value} className="border-b border-border/50">
                    <AccordionTrigger className="text-sm font-semibold text-foreground text-left py-5 hover:text-primary transition-colors">
                      {faq.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-sm text-muted-foreground leading-relaxed pb-5">
                      {faq.answer}
                    </AccordionContent>
                  </AccordionItem>
                </motion.div>
              ))}
            </Accordion>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
