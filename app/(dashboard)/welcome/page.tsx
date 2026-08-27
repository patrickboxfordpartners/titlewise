"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { CheckCircle, Sparkles, FileText, Shield, Calculator, Building, Mail, Bot, ArrowRight } from "lucide-react"

const TOOLS = [
  { icon: Mail, name: "Status Updates", desc: "AI-generated updates from checklist progress" },
  { icon: FileText, name: "Title Analysis", desc: "Parse commitments, flag exceptions" },
  { icon: Shield, name: "CD Reviewer", desc: "TRID-compliant closing disclosure review" },
  { icon: Shield, name: "Wire Verification", desc: "Cross-matter fraud detection" },
  { icon: Building, name: "HOA Reviewer", desc: "Extract key terms and restrictions" },
  { icon: Calculator, name: "Fee Estimate", desc: "County-specific recording fees" },
  { icon: Calculator, name: "Tax Proration", desc: "Per-diem buyer/seller calculations" },
]

export default function WelcomePage() {
  const router = useRouter()
  const [completing, setCompleting] = useState(false)
  const [userName, setUserName] = useState<string | null>(null)

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((d) => setUserName(d.user?.name || null))
      .catch(() => {})
  }, [])

  async function handleComplete() {
    setCompleting(true)
    try {
      await fetch("/api/onboarding/complete", { method: "POST" })
      router.push("/matters?new=1")
    } catch {
      router.push("/matters")
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-3xl w-full"
      >
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-4">
            <Sparkles className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Welcome to TitleWise{userName ? `, ${userName.split(" ")[0]}` : ""}
          </h1>
          <p className="text-muted-foreground text-lg">
            Your AI-powered workspace for real estate closings
          </p>
        </div>

        {/* Features grid */}
        <div className="bg-card border border-border rounded-xl p-8 mb-8">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground mb-6">
            7 AI Tools Included
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {TOOLS.map((tool, i) => (
              <motion.div
                key={tool.name}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <tool.icon className="h-5 w-5 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground">{tool.name}</p>
                  <p className="text-xs text-muted-foreground">{tool.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* How it works */}
        <div className="bg-card border border-border rounded-xl p-8 mb-8">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground mb-6">
            How It Works
          </h2>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 text-sm font-bold text-primary">
                1
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground mb-1">Create a matter</p>
                <p className="text-xs text-muted-foreground">
                  Add client name, property address, and closing date
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 text-sm font-bold text-primary">
                2
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground mb-1">Use AI tools as needed</p>
                <p className="text-xs text-muted-foreground">
                  Upload documents, verify wire instructions, generate status updates
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 text-sm font-bold text-primary">
                3
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground mb-1">Track progress</p>
                <p className="text-xs text-muted-foreground">
                  Auto-generated checklists keep you organized through closing
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-3">
            <button
              onClick={handleComplete}
              disabled={completing}
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white text-base font-semibold rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-60"
            >
              {completing ? "Loading..." : "Create Your First Matter"}
              <ArrowRight className="h-5 w-5" />
            </button>
            <button
              onClick={() => router.push("/demo")}
              className="inline-flex items-center gap-2 px-6 py-3 bg-secondary border border-border text-foreground text-base font-semibold rounded-lg hover:bg-muted/50 transition-colors"
            >
              <Sparkles className="h-5 w-5" />
              See it in action
            </button>
          </div>
          <button
            onClick={() => router.push("/matters")}
            className="block mx-auto text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Skip tour
          </button>
        </div>
      </motion.div>
    </div>
  )
}
