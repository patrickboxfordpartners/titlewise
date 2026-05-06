"use client"

import { useRef, useEffect } from "react"
import { useMotionValue, useTransform, animate } from "framer-motion"

const stats = [
  { value: 30, suffix: "+", label: "Minutes saved per file", prefix: "" },
  { value: 12, suffix: "", label: "AI-powered tools", prefix: "" },
  { value: 7, suffix: "", label: "State-specific templates", prefix: "" },
  { value: 30, suffix: "s", label: "Avg. status update time", prefix: "< " },
]

function AnimatedCounter({ value, suffix, prefix }: { value: number; suffix: string; prefix: string }) {
  const ref = useRef<HTMLSpanElement>(null)
  const count = useMotionValue(0)
  const rounded = useTransform(count, (v) => `${prefix}${Math.round(v)}${suffix}`)
  const started = useRef(false)

  useEffect(() => {
    if (started.current) return
    started.current = true
    const t = setTimeout(() => {
      animate(count, value, { duration: 1.5, ease: [0.16, 1, 0.3, 1] })
    }, 300)
    return () => clearTimeout(t)
  }, [count, value])

  useEffect(() => {
    const unsub = rounded.on("change", (v) => {
      if (ref.current) ref.current.textContent = v
    })
    return unsub
  }, [rounded])

  return <span ref={ref} className="font-mono">{prefix}{value}{suffix}</span>
}

export default function StatsSectionUpgraded() {
  return (
    <section className="bg-section-dark py-20 md:py-24">
      <div className="container mx-auto px-6">
        <div className="mx-auto grid max-w-[1200px] grid-cols-2 lg:grid-cols-4 gap-12">
          {stats.map((stat) => (
            <div key={stat.label} className="text-center">
              <p className="text-4xl font-black text-white md:text-5xl tracking-tighter">
                <AnimatedCounter value={stat.value} suffix={stat.suffix} prefix={stat.prefix} />
              </p>
              <p className="mt-2 text-sm text-white/70 leading-relaxed font-medium">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
