"use client"

import { FileText, FileSearch, Zap, Bot } from "lucide-react"
import { motion } from "framer-motion"

const steps = [
  { step: "01", icon: FileText, title: "Upload", description: "Drop in your title commitment, closing disclosure, HOA docs, or wire instructions." },
  { step: "02", icon: FileSearch, title: "Analyze", description: "TITLEwise reviews the document across compliance, fraud, and accuracy checks—flagging what matters." },
  { step: "03", icon: Bot, title: "Automate", description: "The AI agent updates your checklists, drafts client emails, and moves matters forward automatically." },
  { step: "04", icon: Zap, title: "Close", description: "Export polished PDFs, share client portals, and clear-to-close with confidence." },
]

export default function HowItWorksSectionUpgraded() {
  return (
    <section className="bg-section-alt py-20 md:py-24">
      <div className="container mx-auto px-6">
        <div className="mx-auto mb-16 max-w-[65ch] text-center">
          <h2 className="text-4xl font-black text-foreground md:text-5xl tracking-tighter">
            How it works
          </h2>
          <p className="mt-4 text-base text-muted-foreground leading-relaxed font-medium">
            Four steps to a faster closing workflow
          </p>
        </div>

        <div className="mx-auto max-w-[1200px]">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((item, i) => (
              <div key={item.step} className="relative text-center">
                <motion.div
                  className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/10 border-2 border-primary/20 mx-auto"
                  whileHover={{
                    scale: 1.05,
                    rotate: 3,
                    transition: { type: "spring", stiffness: 400, damping: 20 }
                  }}
                >
                  <item.icon className="h-8 w-8 text-primary" strokeWidth={2} />
                </motion.div>

                <div className="inline-block mb-3 rounded-full bg-primary/10 px-3 py-1">
                  <span className="text-[10px] font-black uppercase tracking-widest text-primary">
                    Step {item.step}
                  </span>
                </div>

                <h3 className="text-lg font-black text-foreground tracking-tight">{item.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground font-medium mx-auto">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
