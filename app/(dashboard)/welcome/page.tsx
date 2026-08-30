"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { motion } from "framer-motion"
import { CheckCircle, Sparkles, FileText, Shield, Calculator, Building, Mail, Bot, ArrowRight } from "lucide-react"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"

const TOOLS = [
  {
    icon: Mail,
    name: "Status Updates",
    desc: "AI-generated updates from checklist progress",
    detail: "Automatically draft professional status update emails to clients by analyzing your matter's checklist progress. The AI summarizes completed items, outstanding tasks, and upcoming deadlines in a tone you choose."
  },
  {
    icon: FileText,
    name: "Title Analysis",
    desc: "Parse commitments, flag exceptions",
    detail: "Upload a title commitment and get instant analysis of Schedule B exceptions, requirements, and potential issues. The AI identifies liens, easements, and conditions that need attention before closing."
  },
  {
    icon: Shield,
    name: "CD Reviewer",
    desc: "TRID-compliant closing disclosure review",
    detail: "Verify closing disclosure accuracy against TRID requirements. The AI checks loan terms, fee calculations, date accuracy, and tolerance violations to catch errors before they become compliance issues."
  },
  {
    icon: Shield,
    name: "Wire Verification",
    desc: "Cross-matter fraud detection",
    detail: "Verify wire instructions by comparing them against your institutional memory across all past matters. The AI detects anomalies, flags suspicious changes, and identifies potential wire fraud attempts."
  },
  {
    icon: Building,
    name: "HOA Reviewer",
    desc: "Extract key terms and restrictions",
    detail: "Upload HOA documents and get a structured summary of fees, restrictions, approval requirements, and special assessments. The AI highlights red flags like pending litigation or high delinquency rates."
  },
  {
    icon: Calculator,
    name: "Fee Estimate",
    desc: "County-specific recording fees",
    detail: "Generate accurate fee estimate letters based on your transaction's county, state, and property value. The AI calculates recording fees, transfer taxes, and other closing costs specific to your jurisdiction."
  },
  {
    icon: Calculator,
    name: "Tax Proration",
    desc: "Per-diem buyer/seller calculations",
    detail: "Calculate property tax prorations with per-diem accuracy. Enter the closing date and tax information, and the AI computes the buyer and seller portions accounting for payment schedules and arrears."
  },
]

export default function WelcomePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const subscribed = searchParams.get("subscribed") === "true"
  const [completing, setCompleting] = useState(false)
  const [userName, setUserName] = useState<string | null>(null)
  const [hoveredTool, setHoveredTool] = useState<string | null>(null)

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((d) => setUserName(d.user?.name || null))
      .catch(() => {})
  }, [])

  async function handleComplete() {
    setCompleting(true)
    // Skip API call in dev bypass mode - just redirect
    router.push("/matters?new=1")
  }

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Gradient backdrop - blue theme */}
      <div
        className="absolute top-0 left-0 right-0 z-0"
        style={{
          height: "40vh",
          background: "linear-gradient(90deg, #e3f2fd 0%, #90caf9 25%, #42a5f5 50%, #1e88e5 75%, #1565c0 100%)",
          filter: "blur(60px)",
          opacity: 0.3,
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/80 to-white z-0" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-3xl w-full relative z-10"
      >
        {/* Header */}
        <div className="text-center mb-12">
          {subscribed && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring" }}
              className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#0066cc]/10 mb-4"
            >
              <CheckCircle className="h-8 w-8 text-[#0066cc]" />
            </motion.div>
          )}
          {!subscribed && (
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#0066cc]/10 mb-4">
              <Sparkles className="h-8 w-8 text-[#0066cc]" />
            </div>
          )}
          <h1 className="text-5xl font-light tracking-[-1.4px] text-[#0d253d] mb-2">
            Welcome to TitleWise{userName ? `, ${userName.split(" ")[0]}` : ""}
          </h1>
          <p className="text-[#64748d] text-lg font-light">
            {subscribed ? "Your subscription is active. Let's get started." : "Your AI-powered workspace for real estate closings"}
          </p>
        </div>

        {/* Features grid */}
        <div className="bg-white border border-[#e3e8ee] rounded-xl p-8 mb-8" style={{ boxShadow: "rgba(0,55,112,0.08) 0 1px 3px" }}>
          <h2 className="text-sm font-normal uppercase tracking-widest text-[#0066cc] mb-6">
            7 AI Tools Included
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {TOOLS.map((tool, i) => (
              <motion.div
                key={tool.name}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="relative flex items-start gap-3 p-3 rounded-lg hover:bg-[#f8fafc] transition-colors cursor-pointer"
                onMouseEnter={() => setHoveredTool(tool.name)}
                onMouseLeave={() => setHoveredTool(null)}
              >
                <div className="w-10 h-10 rounded-lg bg-[#0066cc]/10 flex items-center justify-center shrink-0">
                  <tool.icon className="h-5 w-5 text-[#0066cc]" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-light text-[#0d253d]">{tool.name}</p>
                  <p className="text-xs font-light text-[#64748d]">{tool.desc}</p>
                </div>

                {/* Tooltip */}
                {hoveredTool === tool.name && (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute z-50 left-0 top-full mt-2 w-full sm:w-80 bg-white border border-[#e3e8ee] rounded-lg p-4 shadow-lg"
                  >
                    <p className="text-xs font-light text-[#0d253d] leading-relaxed">
                      {tool.detail}
                    </p>
                  </motion.div>
                )}
              </motion.div>
            ))}
          </div>
        </div>

        {/* How it works */}
        <div className="bg-white border border-[#e3e8ee] rounded-xl p-8 mb-8" style={{ boxShadow: "rgba(0,55,112,0.08) 0 1px 3px" }}>
          <h2 className="text-sm font-normal uppercase tracking-widest text-[#0066cc] mb-6">
            How It Works
          </h2>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-[#0066cc]/10 flex items-center justify-center shrink-0 text-sm font-normal text-[#0066cc]">
                1
              </div>
              <div>
                <p className="text-sm font-light text-[#0d253d] mb-1">Create a matter</p>
                <p className="text-xs font-light text-[#64748d]">
                  Add client name, property address, and closing date
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-[#0066cc]/10 flex items-center justify-center shrink-0 text-sm font-normal text-[#0066cc]">
                2
              </div>
              <div>
                <p className="text-sm font-light text-[#0d253d] mb-1">Use AI tools as needed</p>
                <p className="text-xs font-light text-[#64748d]">
                  Upload documents, verify wire instructions, generate status updates
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-[#0066cc]/10 flex items-center justify-center shrink-0 text-sm font-normal text-[#0066cc]">
                3
              </div>
              <div>
                <p className="text-sm font-light text-[#0d253d] mb-1">Track progress</p>
                <p className="text-xs font-light text-[#64748d]">
                  Auto-generated checklists keep you organized through closing
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* FAQ */}
        <div className="bg-white border border-[#e3e8ee] rounded-xl p-8 mb-8" style={{ boxShadow: "rgba(0,55,112,0.08) 0 1px 3px" }}>
          <h2 className="text-sm font-normal uppercase tracking-widest text-[#0066cc] mb-6">
            Getting Started
          </h2>
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="first-matter">
              <AccordionTrigger className="text-sm font-light text-[#0d253d]">What should I do first?</AccordionTrigger>
              <AccordionContent className="text-sm font-light text-[#64748d]">
                Create your first matter by clicking the button below. You'll add basic information like client name, property address, and closing date. TitleWise will automatically generate a closing checklist based on your transaction type and state.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="tools">
              <AccordionTrigger className="text-sm font-light text-[#0d253d]">When do I use the AI tools?</AccordionTrigger>
              <AccordionContent className="text-sm font-light text-[#64748d]">
                Access AI tools from any matter's detail page. Upload a title commitment for analysis, verify wire instructions for fraud detection, or generate a status update email based on your checklist progress. Each tool is designed for a specific closing task.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="checklist">
              <AccordionTrigger className="text-sm font-light text-[#0d253d]">How does the checklist work?</AccordionTrigger>
              <AccordionContent className="text-sm font-light text-[#64748d]">
                Every matter gets a state-specific closing checklist automatically. Mark items as pending, in progress, or complete. Assign tasks to different parties (buyer, seller, lender, etc.). Add custom items anytime. Your progress bar updates in real time.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="portal">
              <AccordionTrigger className="text-sm font-light text-[#0d253d]">What is the client portal?</AccordionTrigger>
              <AccordionContent className="text-sm font-light text-[#64748d]">
                Generate a shareable link from any matter to give your clients real-time visibility into their closing progress. They can see checklist status and closing date without needing a TitleWise account. Available on Small Firm plans and above.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="limits">
              <AccordionTrigger className="text-sm font-light text-[#0d253d]">Are there usage limits?</AccordionTrigger>
              <AccordionContent className="text-sm font-light text-[#64748d]">
                Your plan includes a monthly generation limit for AI tools (100 for Solo, 500 for Small Firm, 1,500 for Pro). One "generation" is one AI tool run — uploading a document and getting analysis back. Track your usage in Settings. Limits reset on your billing date.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>

        {/* CTA */}
        <div className="text-center">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-3">
            <button
              onClick={handleComplete}
              disabled={completing}
              className="inline-flex items-center gap-2 px-8 py-2 bg-[#0066cc] text-white text-base font-normal rounded-full hover:bg-[#0052a3] transition-colors disabled:opacity-60 shadow-lg hover:shadow-xl"
            >
              {completing ? "Loading..." : "Create Your First Matter"}
              <ArrowRight className="h-5 w-5" />
            </button>
            <button
              onClick={() => router.push("/demo")}
              className="inline-flex items-center gap-2 px-8 py-2 bg-white border border-[#e3e8ee] text-[#0d253d] text-base font-normal rounded-full hover:bg-[#f8fafc] transition-colors"
            >
              <Sparkles className="h-5 w-5" />
              See it in action
            </button>
          </div>
          <button
            onClick={() => router.push("/matters")}
            className="block mx-auto text-sm font-light text-[#64748d] hover:text-[#0d253d] transition-colors"
          >
            Skip tour
          </button>
        </div>
      </motion.div>
    </div>
  )
}
