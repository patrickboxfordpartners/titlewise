"use client"

import { useEffect, useRef } from "react"

export interface ClosingTask {
  id: string
  name: string
  start: string
  end: string
  progress: number
  dependencies?: string
  custom_class?: string
  [key: string]: unknown
}

interface ClosingGanttProps {
  tasks: ClosingTask[]
  onDateChange?: (taskId: string, start: Date, end: Date) => void
  readonly?: boolean
}

// Inject TITLEwise-themed overrides on top of frappe-gantt default CSS
const GANTT_STYLES = `
  .gantt .grid-header { fill: #1e293b; stroke: #475569; }
  .gantt .grid-row { fill: transparent; }
  .gantt .grid-row:nth-child(even) { fill: rgba(255,255,255,0.02); }
  .gantt .row-line { stroke: #334155; }
  .gantt .tick { stroke: #475569; stroke-width: 0.5; }
  .gantt .tick.thick { stroke: #3b82f6; stroke-width: 1; }
  .gantt .upper-text { fill: #94a3b8; font-family: 'DM Sans', sans-serif; font-size: 11px; }
  .gantt .lower-text { fill: #cbd5e1; font-family: 'DM Sans', sans-serif; font-size: 11px; }
  .gantt .bar-wrapper .bar { fill: #1e40af; rx: 3; ry: 3; }
  .gantt .bar-wrapper .bar-progress { fill: #3b82f6; rx: 3; ry: 3; }
  .gantt .bar-wrapper .bar-label { fill: #f1f5f9; font-family: 'DM Sans', sans-serif; font-size: 11px; }
  .gantt .bar-wrapper:hover .bar { fill: #1d4ed8; }
  .gantt .bar-wrapper.active .bar { fill: #2563eb; }
  .gantt .bar-wrapper.bar-complete .bar { fill: #064e3b; }
  .gantt .bar-wrapper.bar-complete .bar-progress { fill: #10b981; }
  .gantt .bar-wrapper.bar-blocked .bar { fill: #7f1d1d; }
  .gantt .bar-wrapper.bar-blocked .bar-progress { fill: #ef4444; }
  .gantt .bar-wrapper.bar-pending .bar { fill: #292524; }
  .gantt .bar-wrapper.bar-pending .bar-progress { fill: #78716c; }
  .gantt .arrow { stroke: #3b82f6; stroke-width: 1.5; fill: #3b82f6; }
  .gantt .handle { fill: #3b82f6; }
  .gantt-container { background: #0f172a; border-radius: 6px; overflow: hidden; }
  .gantt .popup-wrapper { background: #1e293b; border: 1px solid #475569; border-radius: 6px; padding: 10px 14px; box-shadow: 0 4px 12px rgba(0,0,0,0.4); }
  .gantt .popup-wrapper .title { color: #f1f5f9; font-family: 'DM Sans', sans-serif; font-size: 12px; font-weight: 600; }
  .gantt .popup-wrapper .subtitle { color: #94a3b8; font-family: 'DM Sans', sans-serif; font-size: 11px; margin-top: 2px; }
  .gantt .today-highlight { fill: #3b82f6; opacity: 0.08; }
`

export function ClosingGantt({ tasks, onDateChange, readonly = false }: ClosingGanttProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const ganttRef = useRef<any>(null)
  const styleRef = useRef<HTMLStyleElement | null>(null)

  useEffect(() => {
    if (!containerRef.current || tasks.length === 0) return

    // Inject theme styles once
    if (!styleRef.current) {
      const style = document.createElement("style")
      style.textContent = GANTT_STYLES
      document.head.appendChild(style)
      styleRef.current = style
    }

    import("frappe-gantt").then(({ default: Gantt }) => {
      // Destroy previous instance
      if (containerRef.current) containerRef.current.innerHTML = ""

      ganttRef.current = new Gantt(containerRef.current!, tasks, {
        view_mode: "Day",
        readonly,
        move_dependencies: true,
        scroll_to: "today",
        today_button: false,
        holidays: { "#1e293b40": "weekend" },
        on_date_change: (task: any, start: Date, end: Date) => {
          onDateChange?.(task.id, start, end)
        },
        on_click: () => {},
        popup: (task: any) => {
          const start = new Date(task._start).toLocaleDateString("en-US", { month: "short", day: "numeric" })
          const end = new Date(task._end).toLocaleDateString("en-US", { month: "short", day: "numeric" })
          return `
            <div class="title">${task.name}</div>
            <div class="subtitle">${start} → ${end} · ${task.progress}% complete</div>
          `
        },
      })
    })

    return () => {
      if (containerRef.current) containerRef.current.innerHTML = ""
      ganttRef.current = null
    }
  }, [tasks, readonly])

  // Cleanup style on unmount
  useEffect(() => {
    return () => {
      styleRef.current?.remove()
      styleRef.current = null
    }
  }, [])

  if (tasks.length === 0) {
    return (
      <div className="flex items-center justify-center h-32 text-sm text-slate-500">
        No tasks with due dates to display on timeline.
      </div>
    )
  }

  return (
    <div className="gantt-container w-full overflow-x-auto">
      <div ref={containerRef} />
    </div>
  )
}
