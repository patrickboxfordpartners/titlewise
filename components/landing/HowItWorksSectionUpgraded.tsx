"use client"

import { FileText, FileSearch, Zap, Bot } from "lucide-react"
import { motion } from "framer-motion"

const steps = [
  { step: "01", icon: FileText, title: "Upload", description: "Drop in your title commitment, closing disclosure, HOA docs, or wire instructions." },
  { step: "02", icon: FileSearch, title: "Analyze", description: "TitleWise reviews the document across compliance, fraud, and accuracy checks—flagging what matters." },
  { step: "03", icon: Bot, title: "Automate", description: "The AI agent updates your checklists, drafts client emails, and moves matters forward automatically." },
  { step: "04", icon: Zap, title: "Close", description: "Export polished PDFs, share client portals, and clear-to-close with confidence." },
]

export default function HowItWorksSectionUpgraded() {
  return (
    <section className="bg-section-alt py-20 md:py-28">
      <div className="container mx-auto px-6">
        <motion.div
          className="mx-auto mb-16 max-w-[65ch]"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.01 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          <h2 className="text-4xl font-bold text-foreground md:text-5xl tracking-tighter">
            How it works
          </h2>
          <p className="mt-5 text-base text-muted-foreground leading-relaxed">
            Four steps to a faster closing workflow
          </p>
        </motion.div>

        {/* Changed from grid to asymmetric layout */}
        <div className="mx-auto max-w-[1400px]">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-12">
            {steps.map((item, i) => (
              <motion.div
                key={item.step}
                className="relative"
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.01 }}
                transition={{
                  delay: i * 0.12,
                  duration: 0.6,
                  ease: [0.16, 1, 0.3, 1]
                }}
              >
                {/* Connection line - asymmetric positioning */}
                {i < 3 && (
                  <div className="absolute top-12 left-[calc(100%+1rem)] hidden w-[calc(100%-2rem)] border-t-2 border-dashed border-border/40 lg:block" />
                )}

                <motion.div
                  className="mb-6 flex h-24 w-24 items-center justify-center rounded-[2rem] bg-primary/10 border border-primary/20"
                  whileHover={{
                    scale: 1.05,
                    rotate: 3,
                    transition: { type: "spring", stiffness: 400, damping: 20 }
                  }}
                >
                  <item.icon className="h-10 w-10 text-primary" strokeWidth={1.5} />
                </motion.div>

                <div className="inline-block mb-3 rounded-full bg-primary/10 px-3 py-1">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-primary">
                    Step {item.step}
                  </span>
                </div>

                <h3 className="text-xl font-bold text-foreground tracking-tight">{item.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground max-w-[32ch]">
                  {item.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
