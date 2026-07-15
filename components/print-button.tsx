"use client"

import { useState } from "react"
import { Printer, Loader2 } from "lucide-react"

export function PrintButton({ label = "Export PDF", filename }: { label?: string; filename?: string }) {
  const [loading, setLoading] = useState(false)

  async function handleExport() {
    setLoading(true)
    try {
      const noPrint = document.querySelectorAll('.no-print, [data-no-print]')
      noPrint.forEach(el => (el as HTMLElement).style.display = 'none')

      const styles = Array.from(document.styleSheets).flatMap(sheet => {
        try { return Array.from(sheet.cssRules).map(r => r.cssText) }
        catch { return [] }
      }).join('\n')

      const bodyHtml = document.body.innerHTML
      noPrint.forEach(el => (el as HTMLElement).style.display = '')

      const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<style>
  *, *::before, *::after { box-sizing: border-box; }
  body { font-family: system-ui, -apple-system, 'Segoe UI', sans-serif; font-size: 14px; line-height: 1.6; color: #111827; background: #fff; }
  .no-print, [data-no-print] { display: none !important; }
  ${styles}
</style>
</head>
<body>${bodyHtml}</body>
</html>`

      const res = await fetch('/api/pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ html, filename: filename ?? `titlewise-${Date.now()}.pdf` }),
      })

      if (!res.ok) {
        window.print()
        return
      }

      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename ?? `titlewise-${Date.now()}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      window.print()
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleExport}
      disabled={loading}
      className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-md bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors print:hidden disabled:opacity-60"
    >
      {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Printer className="h-3.5 w-3.5" />}
      {loading ? 'Generating...' : label}
    </button>
  )
}
