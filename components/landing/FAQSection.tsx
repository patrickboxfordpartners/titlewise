"use client"

import Link from "next/link"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { motion } from "framer-motion"
import { featuredFaqs } from "./faq-data"

export default function FAQSection() {
  return (
    <section className="bg-section-accent py-20 md:py-28">
      <div className="container mx-auto px-6">
        <motion.div
          className="mx-auto max-w-3xl"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.01 }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-center text-3xl font-bold text-foreground tracking-tight md:text-4xl">
            Frequently Asked Questions
          </h2>
          <p className="mt-4 text-center text-muted-foreground">
            Common questions about TitleWise and AI-powered title review.
          </p>

          <Accordion type="single" collapsible className="mt-10 w-full">
            {featuredFaqs.map((faq) => (
              <AccordionItem key={faq.value} value={faq.value}>
                <AccordionTrigger className="text-sm font-medium text-foreground text-left hover:text-primary transition-colors">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground leading-relaxed">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>

          <div className="mt-10 text-center">
            <Link
              href="/faq"
              className="text-sm font-semibold text-primary hover:underline"
            >
              See all frequently asked questions &rarr;
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
