"use client"

import { useRef, useEffect } from "react"
import { motion, useInView, useMotionValue, useTransform, animate } from "framer-motion"

const stats = [
  { value: 30, suffix: "+", label: "Minutes saved per file", prefix: "" },
  { value: 12, suffix: "", label: "AI-powered tools", prefix: "" },
  { value: 7, suffix: "", label: "State-specific templates", prefix: "" },
  { value: 99, suffix: "%", label: "Accuracy rate", prefix: "" },
]

function AnimatedCounter({ value, suffix, prefix }: { value: number; suffix: string; prefix: string }) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true })
  const count = useMotionValue(0)
  const rounded = useTransform(count, (v) => `${prefix}${Math.round(v)}${suffix}`)

  useEffect(() => {
    if (inView) {
      animate(count, value, { duration: 1.5, ease: "easeOut" })
    }
  }, [inView, count, value])

  useEffect(() => {
    const unsub = rounded.on("change", (v) => {
      if (ref.current) ref.current.textContent = v
    })
    return unsub
  }, [rounded])

  return <span ref={ref}>0</span>
}

export default function StatsSection() {
  return (
    <section className="bg-section-dark py-12">
      <div className="container mx-auto px-6">
        <div className="mx-auto grid max-w-4xl grid-cols-2 sm:grid-cols-4 gap-6 sm:gap-8">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              className="text-center"
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.4 }}
            >
              <p className="text-3xl font-bold text-white md:text-4xl">
                <AnimatedCounter value={stat.value} suffix={stat.suffix} prefix={stat.prefix} />
              </p>
              <p className="mt-1 text-sm text-white/60">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
