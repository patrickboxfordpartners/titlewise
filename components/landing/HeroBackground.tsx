"use client"

import { motion, useReducedMotion } from "framer-motion"

export default function HeroBackground() {
  const prefersReducedMotion = useReducedMotion()

  if (prefersReducedMotion) {
    return (
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute -top-1/4 -left-1/4 h-[700px] w-[700px] rounded-full opacity-[0.07]"
          style={{ background: "radial-gradient(circle, #3b82f6 0%, transparent 70%)" }}
        />
        <div
          className="absolute -bottom-1/4 -right-1/4 h-[600px] w-[600px] rounded-full opacity-[0.05]"
          style={{ background: "radial-gradient(circle, #6366f1 0%, transparent 70%)" }}
        />
      </div>
    )
  }

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <motion.div
        className="absolute -top-1/4 -left-1/4 h-[700px] w-[700px] rounded-full opacity-[0.07]"
        style={{ background: "radial-gradient(circle, #3b82f6 0%, transparent 70%)" }}
        animate={{ x: [0, 80, 0], y: [0, 60, 0], scale: [1, 1.15, 1] }}
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute -bottom-1/4 -right-1/4 h-[600px] w-[600px] rounded-full opacity-[0.05]"
        style={{ background: "radial-gradient(circle, #6366f1 0%, transparent 70%)" }}
        animate={{ x: [0, -60, 0], y: [0, -80, 0], scale: [1, 1.2, 1] }}
        transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute top-1/3 right-1/4 h-[500px] w-[500px] rounded-full opacity-[0.04]"
        style={{ background: "radial-gradient(circle, #3b82f6 0%, transparent 70%)" }}
        animate={{ x: [0, 40, -30, 0], y: [0, -40, 30, 0] }}
        transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
      />
    </div>
  )
}
