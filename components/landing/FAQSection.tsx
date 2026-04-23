"use client"

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { motion } from "framer-motion"

const faqs = [
  {
    value: "what",
    question: "What is TITLEwise?",
    answer: "TITLEwise is an AI-powered closing platform built specifically for real estate attorneys. It combines 12 document analysis tools, an autonomous closing coordinator agent, client portals, TRID compliance checks, and wire fraud protection -- so you can close faster with fewer errors.",
  },
  {
    value: "security",
    question: "Is my data secure?",
    answer: "Absolutely. All data is encrypted in transit and at rest. We never share or sell your information. TITLEwise is built with the security and confidentiality standards real estate attorneys expect.",
  },
  {
    value: "tools",
    question: "Which tools are included?",
    answer: "Every plan includes 8 core tools: Status Update Generator, Title Commitment Analyzer, Closing Disclosure Reviewer, Wire Verification, HOA Document Reviewer, Fee Estimator, Tax Proration Calculator, and state-specific Closing Checklists. Higher plans add the Autonomous Closing Agent, Client Matter Portal, TRID Compliance Engine, and Wire Fraud Institutional Memory.",
  },
  {
    value: "agent",
    question: "What does the AI closing agent do?",
    answer: "The autonomous closing coordinator analyzes your entire matter, auto-updates checklist items as they're completed, drafts status update emails, and flags potential issues -- all without you lifting a finger. It's available on Pro and Enterprise plans.",
  },
  {
    value: "portal",
    question: "How does the client portal work?",
    answer: "Share a secure link with your client and they can track checklist progress, closing status, and key milestones in real time. No login required for clients -- just a unique, secure URL. Available on Small Firm plans and above.",
  },
  {
    value: "states",
    question: "Which states are supported?",
    answer: "TITLEwise includes state-specific checklist templates for NH, MA, NY, CA, FL, TX, and PA, with more states being added regularly. The document analysis tools work with closings in all 50 states.",
  },
  {
    value: "integration",
    question: "Does it integrate with my existing workflow?",
    answer: "Yes. TITLEwise works alongside your current tools. Upload documents in standard formats (PDF, DOCX), review AI-generated insights, and export results as polished PDFs ready for clients or co-counsel.",
  },
  {
    value: "cancel",
    question: "Can I cancel anytime?",
    answer: "Yes. There are no long-term contracts or cancellation fees. You can cancel at any time, and you'll retain access through the end of your current billing period.",
  },
]

export default function FAQSection() {
  return (
    <section className="bg-section-accent py-20 md:py-28">
      <div className="container mx-auto px-6">
        <motion.div
          className="mx-auto max-w-3xl"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-center text-3xl font-bold text-foreground tracking-tight md:text-4xl">
            Frequently Asked Questions
          </h2>
          <p className="mt-4 text-center text-muted-foreground">
            Everything you need to know about TITLEwise.
          </p>

          <Accordion type="single" collapsible className="mt-10 w-full">
            {faqs.map((faq) => (
              <AccordionItem key={faq.value} value={faq.value}>
                <AccordionTrigger className="text-sm font-medium text-foreground text-left">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </motion.div>
      </div>
    </section>
  )
}
