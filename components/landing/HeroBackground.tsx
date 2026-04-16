"use client"

import { motion, useReducedMotion } from "framer-motion"

export default function HeroBackground() {
  const prefersReducedMotion = useReducedMotion()

  // Static background only for users who prefer reduced motion
  if (prefersReducedMotion) {
    return (
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute -top-1/4 -left-1/4 h-[700px] w-[700px] rounded-full opacity-[0.14]"
          style={{ background: "radial-gradient(circle, var(--primary) 0%, transparent 70%)" }}
        />
        <div
          className="absolute -bottom-1/4 -right-1/4 h-[600px] w-[600px] rounded-full opacity-[0.10]"
          style={{ background: "radial-gradient(circle, hsl(225 73% 70%) 0%, transparent 70%)" }}
        />
        <div
          className="absolute inset-0 opacity-[0.05]"
          style={{
            backgroundImage: `radial-gradient(circle, var(--primary) 1px, transparent 1px)`,
            backgroundSize: "40px 40px",
          }}
        />
      </div>
    )
  }

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <motion.div
        className="absolute -top-1/4 -left-1/4 h-[700px] w-[700px] rounded-full opacity-[0.14]"
        style={{ background: "radial-gradient(circle, var(--primary) 0%, transparent 70%)" }}
        animate={{ x: [0, 80, 0], y: [0, 60, 0], scale: [1, 1.15, 1] }}
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute -bottom-1/4 -right-1/4 h-[600px] w-[600px] rounded-full opacity-[0.10]"
        style={{ background: "radial-gradient(circle, hsl(225 73% 70%) 0%, transparent 70%)" }}
        animate={{ x: [0, -60, 0], y: [0, -80, 0], scale: [1, 1.2, 1] }}
        transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute top-1/3 right-1/4 h-[500px] w-[500px] rounded-full opacity-[0.08]"
        style={{ background: "radial-gradient(circle, hsl(225 73% 57%) 0%, transparent 70%)" }}
        animate={{ x: [0, 40, -30, 0], y: [0, -40, 30, 0] }}
        transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
      />
      <div
        className="absolute inset-0 opacity-[0.05]"
        style={{
          backgroundImage: `radial-gradient(circle, var(--primary) 1px, transparent 1px)`,
          backgroundSize: "40px 40px",
        }}
      />
      {Array.from({ length: 12 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute h-1.5 w-1.5 rounded-full bg-primary/30"
          style={{
            left: `${10 + (i * 7) % 80}%`,
            top: `${15 + (i * 11) % 70}%`,
          }}
          animate={{ y: [0, -20 - i * 3, 0], opacity: [0.2, 0.5, 0.2] }}
          transition={{ duration: 4 + i * 0.5, repeat: Infinity, ease: "easeInOut", delay: i * 0.3 }}
        />
      ))}
    </div>
  )
}
