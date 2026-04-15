import Link from "next/link"
import { FileText, FileSearch, ArrowRight, FileCheck, Shield, Building, DollarSign, Calculator } from "lucide-react"

const tools = [
  {
    href: "/status-update",
    icon: FileText,
    title: "Status Update Generator",
    description: "Draft a professional client update email in seconds.",
  },
  {
    href: "/title-analysis",
    icon: FileSearch,
    title: "Title Commitment Analyzer",
    description: "Plain-English breakdown of requirements, exceptions, and red flags.",
  },
  {
    href: "/cd-reviewer",
    icon: FileCheck,
    title: "Closing Disclosure Reviewer",
    description: "Compare a CD against contract terms and flag discrepancies.",
  },
  {
    href: "/wire-verification",
    icon: Shield,
    title: "Wire Fraud Prevention",
    description: "Analyze wire instructions for fraud indicators and generate verification emails.",
  },
  {
    href: "/hoa-reviewer",
    icon: Building,
    title: "HOA Document Reviewer",
    description: "Extract fees, restrictions, litigation, and red flags from HOA/condo docs.",
  },
  {
    href: "/fee-estimate",
    icon: DollarSign,
    title: "Fee Estimate Generator",
    description: "Generate a professional fee estimate letter for client intake.",
  },
  {
    href: "/proration-calculator",
    icon: Calculator,
    title: "Property Tax Proration",
    description: "Calculate buyer/seller tax prorations with per-diem breakdown.",
  },
]

export default function DashboardPage() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-slate-900">Dashboard</h1>
        <p className="text-sm text-slate-500 mt-1">
          AI tools built for real estate closing attorneys.
        </p>
      </div>

      <div className="grid gap-3">
        {tools.map(({ href, icon: Icon, title, description }) => (
          <Link
            key={href}
            href={href}
            className="group bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-4 transition-all hover:shadow-sm hover:border-blue-200"
          >
            <div className="shrink-0 w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center">
              <Icon className="h-4.5 w-4.5 text-blue-600" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
              <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{description}</p>
            </div>
            <ArrowRight className="h-4 w-4 text-slate-300 shrink-0 group-hover:text-blue-500 transition-colors" />
          </Link>
        ))}
      </div>
    </div>
  )
}
