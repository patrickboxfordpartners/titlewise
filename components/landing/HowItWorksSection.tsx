"use client"

import { FileText, FileSearch, Zap, Bot } from "lucide-react"
import { motion } from "framer-motion"

const steps = [
  { step: "01", icon: FileText, title: "Upload", description: "Drop in your title commitment, closing disclosure, HOA docs, or wire instructions." },
  { step: "02", icon: FileSearch, title: "Analyze", description: "TITLEwise reviews the document across compliance, fraud, and accuracy checks -- flagging what matters." },
  { step: "03", icon: Bot, title: "Automate", description: "The AI agent updates your checklists, drafts client emails, and moves matters forward automatically." },
  { step: "04", icon: Zap, title: "Close", description: "Export polished PDFs, share client portals, and clear-to-close with confidence." },
]

export default function HowItWorksSection() {
  return (
    <section className="bg-section-alt py-20 md:py-28">
      <div className="container mx-auto px-6">
        <motion.div
          className="mx-auto mb-16 max-w-2xl text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.01 }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-3xl font-light text-foreground md:text-4xl tracking-[-1.4px]">
            How it works
          </h2>
          <p className="mt-4 text-lg font-light text-muted-foreground">
            Four steps to a faster closing workflow
          </p>
        </motion.div>

        <div className="mx-auto grid max-w-5xl gap-8 md:grid-cols-4">
          {steps.map((item, i) => (
            <motion.div
              key={item.step}
              className="relative text-center"
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.01 }}
              transition={{ delay: i * 0.15, duration: 0.5 }}
            >
              {i < 3 && (
                <div className="absolute top-10 left-[60%] hidden w-[80%] border-t border-dashed border-border md:block" />
              )}
              <motion.div
                className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/10 border border-primary/10"
                whileHover={{ scale: 1.1, rotate: 4 }}
                transition={{ type: "spring", stiffness: 300, damping: 15 }}
              >
                <item.icon className="h-8 w-8 text-primary" />
              </motion.div>
              <span className="mb-2 inline-block text-xs font-normal uppercase tracking-widest text-primary">
                Step {item.step}
              </span>
              <h3 className="text-lg font-light text-foreground">{item.title}</h3>
              <p className="mt-2 text-sm font-light leading-relaxed text-muted-foreground">{item.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
