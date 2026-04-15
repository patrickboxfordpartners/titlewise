import Link from "next/link"
import { FileText, FileSearch, Clock, CheckCircle, FileCheck, Shield, Building, DollarSign, Calculator, ClipboardList } from "lucide-react"

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "TitleWise",
  applicationCategory: "BusinessApplication",
  description: "AI-powered tools for real estate closing attorneys — 8 tools covering every stage of the closing workflow.",
  offers: {
    "@type": "AggregateOffer",
    lowPrice: "99",
    highPrice: "499",
    priceCurrency: "USD",
    offerCount: "3",
  },
}

const features = [
  {
    icon: FileText,
    title: "Status Update Generator",
    description: "Draft a professional client update email in seconds. Attorneys write these constantly — now they take 30 seconds.",
  },
  {
    icon: FileSearch,
    title: "Title Commitment Analyzer",
    description: "Plain-English breakdown of Schedule B requirements, exceptions, and red flags. Upload PDF or paste text.",
  },
  {
    icon: FileCheck,
    title: "Closing Disclosure Reviewer",
    description: "Compare a CD against contract terms and instantly flag discrepancies in price, dates, credits, and names.",
  },
  {
    icon: Shield,
    title: "Wire Fraud Prevention",
    description: "Analyze wire instructions for fraud indicators and generate a ready-to-send verification email.",
  },
  {
    icon: Building,
    title: "HOA Document Reviewer",
    description: "Extract monthly dues, special assessments, restrictions, and litigation from HOA/condo documents.",
  },
  {
    icon: DollarSign,
    title: "Fee Estimate Generator",
    description: "Generate a professional fee estimate letter for client intake in seconds.",
  },
  {
    icon: Calculator,
    title: "Tax Proration Calculator",
    description: "Calculate buyer/seller property tax prorations with per-diem breakdown and copy-ready output.",
  },
  {
    icon: ClipboardList,
    title: "Closing Checklist Tracker",
    description: "Auto-generated checklists by transaction type. Track items across parties from contract to recording.",
  },
]

const bullets = [
  "8 tools covering every stage of the closing workflow",
  "Built for real estate closing attorneys, not title companies",
  "Plain English output your clients actually understand",
  "Saves 30+ minutes per file, every day",
]

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {/* Nav */}
      <header className="border-b border-slate-100">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <img src="/logo.svg" alt="TitleWise" className="h-9 w-auto" />
          <div className="flex items-center gap-3">
            <Link href="/sign-in" className="text-sm text-slate-600 hover:text-slate-900 font-medium transition-colors">
              Sign in
            </Link>
            <Link href="/sign-up" className="text-sm bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-lg transition-colors">
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-5xl mx-auto px-6 py-20 text-center">
        <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 text-xs font-medium px-3 py-1.5 rounded-full mb-6">
          <Clock className="h-3.5 w-3.5" />
          Built for real estate closing attorneys
        </div>
        <h1 className="text-4xl font-bold text-slate-900 tracking-tight leading-tight mb-4 max-w-2xl mx-auto">
          Stop spending time on emails. Start spending it on closings.
        </h1>
        <p className="text-lg text-slate-500 max-w-xl mx-auto mb-8 leading-relaxed">
          TitleWise gives closing attorneys AI-powered tools that handle the repetitive
          work — so you can focus on the files that need your expertise.
        </p>
        <div className="flex items-center justify-center gap-3">
          <Link
            href="/sign-up"
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-3 rounded-lg text-sm transition-colors"
          >
            Start Free Trial
          </Link>
          <Link
            href="/pricing"
            className="text-sm text-slate-600 hover:text-slate-900 font-medium px-6 py-3 rounded-lg border border-slate-200 hover:border-slate-300 transition-colors"
          >
            View Pricing
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-5xl mx-auto px-6 pb-16">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-slate-900">Everything you need to close faster</h2>
          <p className="text-slate-500 text-sm mt-2">8 tools built around the real estate closing workflow</p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {features.map(({ icon: Icon, title, description }) => (
            <div key={title} className="bg-slate-50 rounded-xl border border-slate-200 p-4">
              <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center mb-3 shadow-sm">
                <Icon className="h-4 w-4 text-blue-600" />
              </div>
              <h3 className="text-sm font-semibold text-slate-900 mb-1">{title}</h3>
              <p className="text-xs text-slate-500 leading-relaxed">{description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Why */}
      <section className="bg-slate-900 py-16">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-2xl font-bold text-white mb-2">
            Designed for how closing attorneys actually work
          </h2>
          <p className="text-slate-400 text-sm mb-8">
            Not a general-purpose AI tool. Not built for title companies. Built for you.
          </p>
          <ul className="space-y-3">
            {bullets.map((b) => (
              <li key={b} className="flex items-start gap-3">
                <CheckCircle className="h-4 w-4 text-blue-400 mt-0.5 shrink-0" />
                <span className="text-sm text-slate-300">{b}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-100 py-6">
        <div className="max-w-5xl mx-auto px-6 flex items-center justify-between">
          <img src="/logo.svg" alt="TitleWise" className="h-8 w-auto" />
          <Link href="/pricing" className="text-sm text-slate-400 hover:text-slate-600 transition-colors">
            Pricing
          </Link>
        </div>
      </footer>
    </div>
  )
}
