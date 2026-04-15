import Link from "next/link"
import { FileText, FileSearch, ArrowRight } from "lucide-react"

const tools = [
  {
    href: "/status-update",
    icon: FileText,
    title: "Status Update Generator",
    description:
      "Draft a professional client update email in seconds. Enter your file details and get a ready-to-send email.",
    badge: null,
  },
  {
    href: "/title-analysis",
    icon: FileSearch,
    title: "Title Commitment Analyzer",
    description:
      "Paste in a title commitment and get a plain-English breakdown of exceptions, requirements, and red flags.",
    badge: null,
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

      <div className="grid gap-4">
        {tools.map(({ href, icon: Icon, title, description, badge }) => (
          <Link
            key={href}
            href={href}
            className="group relative bg-white rounded-xl border border-slate-200 p-5 flex items-start gap-4 transition-all hover:shadow-sm hover:border-blue-200"
          >
            <div className="shrink-0 w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
              <Icon className="h-5 w-5 text-blue-600" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
                {badge && (
                  <span className="text-[10px] font-medium bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded">
                    {badge}
                  </span>
                )}
              </div>
              <p className="text-sm text-slate-500 mt-1 leading-relaxed">{description}</p>
            </div>
            {!badge && (
              <ArrowRight className="h-4 w-4 text-slate-300 shrink-0 mt-0.5 group-hover:text-blue-500 transition-colors" />
            )}
          </Link>
        ))}
      </div>
    </div>
  )
}
