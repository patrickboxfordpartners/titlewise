"use client"

import { useRef, useEffect } from "react"
import { motion, useInView, useMotionValue, useTransform, animate } from "framer-motion"

const stats = [
  { value: 30, suffix: "+", label: "Minutes saved per file", prefix: "" },
  { value: 12, suffix: "", label: "AI-powered tools", prefix: "" },
  { value: 7, suffix: "", label: "State-specific templates", prefix: "" },
  { value: 30, suffix: "s", label: "Avg. status update time", prefix: "< " },
]

function AnimatedCounter({ value, suffix, prefix }: { value: number; suffix: string; prefix: string }) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true, margin: "0px" })
  const count = useMotionValue(0)
  const rounded = useTransform(count, (v) => `${prefix}${Math.round(v)}${suffix}`)
  const started = useRef(false)

  const runAnimation = () => {
    if (started.current) return
    started.current = true
    animate(count, value, { duration: 1.5, ease: [0.16, 1, 0.3, 1] })
  }

  useEffect(() => {
    if (inView) runAnimation()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inView])

  useEffect(() => {
    const t = setTimeout(runAnimation, 400)
    return () => clearTimeout(t)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const unsub = rounded.on("change", (v) => {
      if (ref.current) ref.current.textContent = v
    })
    return unsub
  }, [rounded])

  return <span ref={ref} className="font-mono">{prefix}0{suffix}</span>
}

export default function StatsSectionUpgraded() {
  return (
    <section className="bg-section-dark py-16 md:py-20">
      <div className="container mx-auto px-6">
        <div className="mx-auto grid max-w-[1200px] grid-cols-2 lg:grid-cols-4 gap-12">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              className="text-center"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.01 }}
              transition={{
                delay: i * 0.08,
                duration: 0.5,
                ease: [0.16, 1, 0.3, 1]
              }}
            >
              <p className="text-4xl font-black text-white md:text-5xl tracking-tighter">
                <AnimatedCounter value={stat.value} suffix={stat.suffix} prefix={stat.prefix} />
              </p>
              <p className="mt-2 text-sm text-white/70 leading-relaxed font-medium">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
