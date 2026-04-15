"use client"

import { Printer } from "lucide-react"

export function PrintButton({ label = "Export PDF" }: { label?: string }) {
  return (
    <button
      onClick={() => window.print()}
      className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-md bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors print:hidden"
    >
      <Printer className="h-3.5 w-3.5" />
      {label}
    </button>
  )
}
