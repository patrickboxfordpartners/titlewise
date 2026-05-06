"use client"

import Link from "next/link"
import { Clock, ArrowRight, Shield, FileCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion"
import HeroBackground from "./HeroBackground"
import { useRef } from "react"

const MagneticButton = ({ children, href, variant, ...props }: any) => {
  const ref = useRef<HTMLAnchorElement>(null)
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const springConfig = { damping: 15, stiffness: 150 }
  const springX = useSpring(x, springConfig)
  const springY = useSpring(y, springConfig)

  const handleMouseMove = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (!ref.current) return
    const rect = ref.current.getBoundingClientRect()
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2
    const distanceX = e.clientX - centerX
    const distanceY = e.clientY - centerY
    x.set(distanceX * 0.2)
    y.set(distanceY * 0.2)
  }

  const handleMouseLeave = () => {
    x.set(0)
    y.set(0)
  }

  return (
    <Link href={href}>
      <motion.div
        ref={ref}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{ x: springX, y: springY }}
      >
        <Button variant={variant} size="lg" className="text-base px-8 active:translate-y-[1px]" {...props}>
          {children}
        </Button>
      </motion.div>
    </Link>
  )
}

export default function HeroSectionPersonality() {
  return (
    <section className="relative min-h-[100dvh] flex items-center overflow-hidden pt-24 lg:pt-32">
      <HeroBackground />

      {/* Animated grain texture */}
      <motion.div
        className="absolute inset-0 opacity-[0.03] pointer-events-none z-[1]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='4' numOctaves='3' /%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' /%3E%3C/svg%3E")`,
          backgroundRepeat: "repeat"
        }}
        animate={{
          backgroundPosition: ["0% 0%", "100% 100%"]
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          repeatType: "reverse",
          ease: "linear"
        }}
      />

      <div className="container mx-auto px-6 relative z-10">
        <div className="grid lg:grid-cols-2 gap-16 items-center max-w-[1200px] mx-auto">
          <motion.div
            initial={{ opacity: 1, x: 0 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          >
            <motion.span
              className="inline-flex items-center gap-2 rounded-full bg-blue-500/10 border-2 border-blue-500/30 px-4 py-2 text-[11px] font-black text-blue-600 tracking-wide uppercase"
              style={{ boxShadow: "4px 4px 0px rgba(59, 130, 246, 0.2)" }}
              initial={{ opacity: 1, scale: 1 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: 0.1 }}
            >
              <Clock className="h-3 w-3" strokeWidth={3} />
              Closing Platform
            </motion.span>

            <motion.h1
              className="mt-6 text-5xl font-black leading-[0.95] text-foreground md:text-6xl lg:text-7xl tracking-tighter"
              initial={{ opacity: 1, y: 0 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              30 minutes back.{" "}
              <span className="bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent">
                Every file.
              </span>
            </motion.h1>

            <motion.p
              className="mt-6 text-base leading-relaxed text-muted-foreground max-w-[60ch] font-medium"
              initial={{ opacity: 1, y: 0 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              AI closing coordinator. Document analysis in seconds. Compliance checks automatic. Wire fraud caught before it happens. From intake to clear-to-close—in one system.
            </motion.p>

            <motion.div
              className="mt-10 flex flex-col sm:flex-row gap-4"
              initial={{ opacity: 1, y: 0 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <MagneticButton href="/pricing" variant="hero">
                Get Started <ArrowRight className="ml-1.5 h-4 w-4" strokeWidth={3} />
              </MagneticButton>
              <MagneticButton href="#contact" variant="hero-outline">
                Request a Demo
              </MagneticButton>
            </motion.div>

            <motion.p
              className="mt-6 text-xs text-muted-foreground font-medium"
              initial={{ opacity: 1 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
            >
              Plans from $149/mo · Cancel anytime
            </motion.p>
          </motion.div>

          {/* Right: Trust indicators with symmetrical grid */}
          <motion.div
            className="hidden lg:grid gap-6"
            initial={{ opacity: 1, x: 0 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <div className="grid grid-cols-2 gap-6">
              <motion.div
                className="col-span-2 rounded-2xl border-2 border-red-500/30 bg-card p-6 relative"
                style={{ boxShadow: "6px 6px 0px rgba(239, 68, 68, 0.3)" }}
                initial={{ opacity: 1, y: 0 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.5 }}
                whileHover={{
                  y: -4,
                  boxShadow: "8px 8px 0px rgba(239, 68, 68, 0.4)",
                  transition: { type: "spring", stiffness: 300, damping: 20 }
                }}
              >
                <div className="flex items-start gap-4">
                  <div className="shrink-0 rounded-xl bg-red-500/10 p-3 border-2 border-red-500/20">
                    <Shield className="h-6 w-6 text-red-600" strokeWidth={2.5} />
                  </div>
                  <div>
                    <h3 className="font-black text-foreground tracking-tight text-sm">
                      Wire Fraud Protection
                    </h3>
                    <p className="mt-1 text-xs text-muted-foreground leading-relaxed font-medium">
                      Multi-layer verification stops fraudulent wires
                    </p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                className="rounded-2xl border-2 border-purple-500/30 bg-card p-6 relative"
                style={{ boxShadow: "6px 6px 0px rgba(168, 85, 247, 0.3)" }}
                initial={{ opacity: 1, y: 0 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.6 }}
                whileHover={{
                  y: -4,
                  boxShadow: "8px 8px 0px rgba(168, 85, 247, 0.4)",
                  transition: { type: "spring", stiffness: 300, damping: 20 }
                }}
              >
                <div className="flex flex-col gap-3">
                  <div className="shrink-0 rounded-xl bg-purple-500/10 p-2.5 w-fit border-2 border-purple-500/20">
                    <FileCheck className="h-5 w-5 text-purple-600" strokeWidth={2.5} />
                  </div>
                  <div>
                    <div className="text-3xl font-black tracking-tighter bg-gradient-to-br from-purple-600 to-purple-400 bg-clip-text text-transparent">
                      12
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground font-bold">
                      AI Tools
                    </p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                className="rounded-2xl border-2 border-green-500/30 bg-card p-6 relative"
                style={{ boxShadow: "6px 6px 0px rgba(34, 197, 94, 0.3)" }}
                initial={{ opacity: 1, y: 0 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.7 }}
                whileHover={{
                  y: -4,
                  boxShadow: "8px 8px 0px rgba(34, 197, 94, 0.4)",
                  transition: { type: "spring", stiffness: 300, damping: 20 }
                }}
              >
                <div className="flex flex-col gap-3">
                  <div className="shrink-0 rounded-xl bg-green-500/10 p-2.5 w-fit border-2 border-green-500/20 opacity-0">
                    <FileCheck className="h-5 w-5 text-green-600" strokeWidth={2.5} />
                  </div>
                  <div>
                    <div className="text-3xl font-black tracking-tighter bg-gradient-to-br from-green-600 to-green-400 bg-clip-text text-transparent">
                      24/7
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground font-bold">
                      Autonomous Agent
                    </p>
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
