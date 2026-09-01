"use client"

import Link from "next/link"
import { Clock, ArrowRight, Shield, FileCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"
import HeroBackground from "./HeroBackground"

export default function HeroSectionUpgraded() {
  return (
    <section className="relative min-h-[100dvh] flex items-center overflow-hidden">
      <HeroBackground />
      <div className="container mx-auto px-6 relative z-10">
        {/* Split screen layout - left content, right visual */}
        <div className="grid lg:grid-cols-[1.2fr_1fr] gap-12 lg:gap-20 items-center max-w-[1400px] mx-auto">
          {/* Left: Content */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          >
            <motion.span
              className="inline-flex items-center gap-2 rounded-full border border-border px-3.5 py-1.5 text-[11px] font-medium text-muted-foreground tracking-wide uppercase"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: 0.1 }}
            >
              <Clock className="h-3 w-3" strokeWidth={2} />
              Real Estate Closing Platform
            </motion.span>

            <motion.h1
              className="mt-6 text-5xl font-bold leading-[1.1] text-foreground md:text-6xl lg:text-7xl tracking-tighter"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              Your AI closing coordinator.{" "}
              <span className="text-muted-foreground">
                From intake to clear-to-close.
              </span>
            </motion.h1>

            <motion.p
              className="mt-6 text-base leading-relaxed text-muted-foreground max-w-[65ch]"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              TITLEwise is the AI-powered closing platform built for real estate attorneys. Document analysis, compliance checks, wire fraud protection, client portals, and an autonomous agent that moves your matters forward—all in one place.
            </motion.p>

            <motion.div
              className="mt-10 flex flex-col sm:flex-row gap-3"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <Link href="/pricing">
                <Button variant="hero" size="lg" className="text-base px-8 active:translate-y-[1px]">
                  Get Started <ArrowRight className="ml-1.5 h-4 w-4" strokeWidth={2} />
                </Button>
              </Link>
              <Link href="#contact">
                <Button variant="hero-outline" size="lg" className="text-base px-8 active:translate-y-[1px]">
                  Request a Demo
                </Button>
              </Link>
            </motion.div>

            <motion.p
              className="mt-6 text-xs text-muted-foreground"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
            >
              Plans from $149/mo · Cancel anytime
            </motion.p>
          </motion.div>

          {/* Right: Trust indicators with asymmetric layout */}
          <motion.div
            className="hidden lg:grid gap-6"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            {/* Asymmetric grid: different sizes */}
            <div className="grid grid-cols-2 gap-6">
              <motion.div
                className="col-span-2 rounded-3xl border border-border bg-card/50 backdrop-blur-sm p-8"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.5 }}
              >
                <div className="flex items-start gap-4">
                  <div className="shrink-0 rounded-2xl bg-primary/10 p-3">
                    <Shield className="h-6 w-6 text-primary" strokeWidth={1.5} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground tracking-tight">
                      Wire Fraud Protection
                    </h3>
                    <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
                      Multi-layer verification prevents fraudulent wire instructions
                    </p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                className="rounded-3xl border border-border bg-card/50 backdrop-blur-sm p-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.6 }}
              >
                <div className="flex flex-col gap-3">
                  <div className="shrink-0 rounded-xl bg-primary/10 p-2.5 w-fit">
                    <FileCheck className="h-5 w-5 text-primary" strokeWidth={1.5} />
                  </div>
                  <div>
                    <div className="text-3xl font-bold tracking-tighter">
                      12
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      AI Tools
                    </p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                className="rounded-3xl border border-border bg-card/50 backdrop-blur-sm p-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.7 }}
              >
                <div className="flex flex-col gap-3">
                  <div className="text-3xl font-bold tracking-tighter">
                    24/7
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Autonomous Agent
                  </p>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
