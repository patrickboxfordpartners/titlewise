"use client"

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { motion } from "framer-motion"

const faqs = [
  {
    value: "what",
    question: "What is TITLEwise?",
    answer: "TITLEwise is an AI-powered toolkit built specifically for real estate attorneys. It automates time-consuming tasks like title analysis, closing disclosure review, fee estimation, tax proration, and more — so you can close faster with fewer errors.",
  },
  {
    value: "security",
    question: "Is my data secure?",
    answer: "Absolutely. All data is encrypted in transit and at rest. We never share or sell your information. TITLEwise is built with the security and confidentiality standards real estate attorneys expect.",
  },
  {
    value: "tools",
    question: "Which tools are included?",
    answer: "Every plan includes all 8 tools: Status Update Generator, Title Commitment Analyzer, Closing Disclosure Reviewer, Wire Verification, HOA Document Reviewer, Fee Estimator, Tax Proration Calculator, and Closing Checklists.",
  },
  {
    value: "integration",
    question: "Does it integrate with my existing workflow?",
    answer: "Yes. TITLEwise works alongside your current tools. Upload documents in standard formats (PDF, DOCX), review AI-generated insights, and export results as polished PDFs ready for clients or co-counsel.",
  },
  {
    value: "accuracy",
    question: "How accurate is the AI analysis?",
    answer: "Our models are fine-tuned on real estate legal documents and continuously improved. Every output is designed to assist — not replace — your professional judgment, giving you a reliable first pass that saves hours of manual review.",
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
