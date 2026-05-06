"use client"

import Link from "next/link"
import { FileText, FileSearch, Shield, DollarSign, Calculator, ClipboardList, ArrowRight, FileCheck, Building, Bot, Users, Scale, Brain } from "lucide-react"
import { Button } from "@/components/ui/button"
import { motion, useMotionValue, useSpring } from "framer-motion"
import { useState, useRef } from "react"

const coreTools = [
  { icon: FileText, title: "Status Updates", description: "Client emails drafted. Seconds, not minutes.", color: "blue" },
  { icon: FileSearch, title: "Title Analyzer", description: "Schedule B requirements in plain English. Red flags caught.", color: "blue" },
  { icon: FileCheck, title: "CD Reviewer", description: "Compare CD against contract. Discrepancies flagged.", color: "purple" },
  { icon: Shield, title: "Wire Fraud Prevention", description: "Fraud indicators detected. Verification emails auto-sent.", color: "red" },
  { icon: Building, title: "HOA Reviewer", description: "Dues, assessments, restrictions extracted. Litigation flagged.", color: "purple" },
  { icon: DollarSign, title: "Fee Estimator", description: "Professional estimate letters for intake. Auto-generated.", color: "green" },
  { icon: Calculator, title: "Tax Proration", description: "Buyer/seller prorations calculated. Per-diem breakdown included.", color: "green" },
  { icon: ClipboardList, title: "Closing Checklist", description: "State-specific checklists. NH, MA, NY, CA, FL, TX, PA.", color: "blue" },
]

const premiumFeatures = [
  { icon: Bot, title: "Autonomous Agent", description: "Analyzes matters, updates checklists, drafts status emails. Automatic.", badge: "Pro", color: "purple" },
  { icon: Users, title: "Client Portal", description: "Clients track checklist progress and status in real time.", badge: "Small Firm+", color: "blue" },
  { icon: Scale, title: "TRID Engine", description: "Bucket A/B/C classification. Tolerance cure amounts calculated.", badge: "Pro", color: "orange" },
  { icon: Brain, title: "Wire Fraud Memory", description: "Verified wires stored. Routing number deviations flagged across matters.", badge: "Small Firm+", color: "red" },
]

const colorClasses = {
  blue: {
    border: "border-blue-500/30",
    bg: "bg-blue-500/10",
    icon: "text-blue-600",
    shadow: "rgba(59, 130, 246, 0.3)",
    hoverShadow: "rgba(59, 130, 246, 0.4)"
  },
  purple: {
    border: "border-purple-500/30",
    bg: "bg-purple-500/10",
    icon: "text-purple-600",
    shadow: "rgba(168, 85, 247, 0.3)",
    hoverShadow: "rgba(168, 85, 247, 0.4)"
  },
  red: {
    border: "border-red-500/30",
    bg: "bg-red-500/10",
    icon: "text-red-600",
    shadow: "rgba(239, 68, 68, 0.3)",
    hoverShadow: "rgba(239, 68, 68, 0.4)"
  },
  green: {
    border: "border-green-500/30",
    bg: "bg-green-500/10",
    icon: "text-green-600",
    shadow: "rgba(34, 197, 94, 0.3)",
    hoverShadow: "rgba(34, 197, 94, 0.4)"
  },
  orange: {
    border: "border-orange-500/30",
    bg: "bg-orange-500/10",
    icon: "text-orange-600",
    shadow: "rgba(249, 115, 22, 0.3)",
    hoverShadow: "rgba(249, 115, 22, 0.4)"
  }
}

function ToolCard({ tool, index }: { tool: typeof coreTools[0]; index: number }) {
  const [hovered, setHovered] = useState(false)
  const colors = colorClasses[tool.color as keyof typeof colorClasses]

  return (
    <motion.div
      initial={{ opacity: 1, y: 0 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.01 }}
      transition={{
        delay: index * 0.05,
        duration: 0.5,
        ease: [0.16, 1, 0.3, 1]
      }}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
    >
      <motion.div
        className={`group h-full rounded-2xl border-2 ${colors.border} bg-card p-8 transition-colors duration-200`}
        style={{ boxShadow: `6px 6px 0px ${colors.shadow}` }}
        whileHover={{
          y: -6,
          boxShadow: `10px 10px 0px ${colors.hoverShadow}`,
          transition: { type: "spring", stiffness: 300, damping: 20 }
        }}
      >
        <motion.div
          className={`mb-5 flex h-12 w-12 items-center justify-center rounded-xl ${colors.bg} border-2 ${colors.border}`}
          animate={hovered ? { rotate: 6, scale: 1.05 } : { rotate: 0, scale: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
        >
          <tool.icon className={`h-6 w-6 ${colors.icon}`} strokeWidth={2.5} />
        </motion.div>
        <h3 className="font-black text-foreground tracking-tight">{tool.title}</h3>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground font-medium">{tool.description}</p>
      </motion.div>
    </motion.div>
  )
}

function PremiumCard({ feature, index }: { feature: typeof premiumFeatures[0]; index: number }) {
  const [hovered, setHovered] = useState(false)
  const colors = colorClasses[feature.color as keyof typeof colorClasses]

  return (
    <motion.div
      initial={{ opacity: 1, y: 0 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.01 }}
      transition={{
        delay: index * 0.08 + 0.2,
        duration: 0.5,
        ease: [0.16, 1, 0.3, 1]
      }}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
    >
      <motion.div
        className={`group h-full rounded-2xl border-2 ${colors.border} bg-gradient-to-br from-card to-card/50 p-8 transition-colors duration-200`}
        style={{ boxShadow: `8px 8px 0px ${colors.shadow}` }}
        whileHover={{
          y: -6,
          boxShadow: `12px 12px 0px ${colors.hoverShadow}`,
          transition: { type: "spring", stiffness: 300, damping: 20 }
        }}
      >
        <div className="flex items-start justify-between mb-5">
          <motion.div
            className={`flex h-12 w-12 items-center justify-center rounded-xl ${colors.bg} border-2 ${colors.border}`}
            animate={hovered ? { rotate: 6, scale: 1.05 } : { rotate: 0, scale: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
          >
            <feature.icon className={`h-6 w-6 ${colors.icon}`} strokeWidth={2.5} />
          </motion.div>
          <span className={`rounded-full ${colors.bg} border ${colors.border} px-3 py-1 text-[10px] font-black ${colors.icon} uppercase tracking-wider`}>
            {feature.badge}
          </span>
        </div>
        <h3 className="font-black text-foreground tracking-tight">{feature.title}</h3>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground font-medium">{feature.description}</p>
      </motion.div>
    </motion.div>
  )
}

const MagneticButton = ({ children, href, ...props }: any) => {
  const ref = useRef<HTMLAnchorElement>(null)
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const springConfig = { damping: 15, stiffness: 150 }
  const springX = useSpring(x, springConfig)
  const springY = useSpring(y, springConfig)

  const handleMouseMove = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (!ref.current) return
    const rect = ref.current.getBoundingClientRect()
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2
    const distanceX = e.clientX - centerX
    const distanceY = e.clientY - centerY
    x.set(distanceX * 0.2)
    y.set(distanceY * 0.2)
  }

  const handleMouseLeave = () => {
    x.set(0)
    y.set(0)
  }

  return (
    <Link href={href}>
      <motion.div
        ref={ref}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{ x: springX, y: springY }}
      >
        <Button variant="hero" size="lg" className="text-base px-10 active:translate-y-[1px]" {...props}>
          {children}
        </Button>
      </motion.div>
    </Link>
  )
}

export default function FeaturesSectionPersonality() {
  return (
    <section className="py-16 md:py-20 bg-background">
      <div className="container mx-auto px-6">
        <motion.div
          className="mx-auto mb-16 max-w-[60ch]"
          initial={{ opacity: 1, y: 0 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.01 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          <h2 className="text-4xl font-black text-foreground md:text-5xl tracking-tighter leading-[0.95]">
            Close faster. Work less.
          </h2>
          <p className="mt-5 text-base text-muted-foreground leading-relaxed font-medium">
            12 tools + autonomous agent. Built for the closing workflow.
          </p>
        </motion.div>

        <motion.div
          className="mx-auto mb-6 max-w-[1400px]"
          initial={{ opacity: 1 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, amount: 0.01 }}
        >
          <p className="text-[11px] font-black uppercase tracking-widest text-blue-600">Core Tools — All Plans</p>
        </motion.div>

        <div className="mx-auto grid max-w-[1400px] gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {coreTools.map((tool, i) => (
            <ToolCard key={tool.title} tool={tool} index={i} />
          ))}
        </div>

        <motion.div
          className="mx-auto mt-20 mb-6 max-w-[1400px]"
          initial={{ opacity: 1 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, amount: 0.01 }}
        >
          <p className="text-[11px] font-black uppercase tracking-widest text-purple-600">Advanced — Higher Plans</p>
        </motion.div>

        <div className="mx-auto grid max-w-[1400px] gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {premiumFeatures.map((feature, i) => (
            <PremiumCard key={feature.title} feature={feature} index={i} />
          ))}
        </div>

        <motion.div
          className="mx-auto mt-16 max-w-xl text-center"
          initial={{ opacity: 1, y: 0 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.01 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <MagneticButton href="/sign-up">
            Get Started <ArrowRight className="ml-1.5 h-4 w-4" strokeWidth={3} />
          </MagneticButton>
        </motion.div>
      </div>
    </section>
  )
}
