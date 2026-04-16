"use client"

import { Star } from "lucide-react"
import { motion } from "framer-motion"

export default function TestimonialSection() {
  return (
    <section className="bg-section-accent py-16 border-y border-border">
      <div className="container mx-auto px-6">
        <motion.div
          className="mx-auto max-w-3xl text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex justify-center gap-1 mb-6">
            {[...Array(5)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 + 0.2 }}
              >
                <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
              </motion.div>
            ))}
          </div>
          <blockquote className="text-xl font-medium text-foreground leading-relaxed md:text-2xl">
            "TitleWise cut our status update time from 15 minutes to 30 seconds. It's the first AI tool that actually understands what closing attorneys do."
          </blockquote>
          <div className="mt-6">
            <p className="font-semibold text-foreground text-sm">Sarah Mitchell</p>
            <p className="text-xs text-muted-foreground">Managing Partner, Mitchell & Associates</p>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
