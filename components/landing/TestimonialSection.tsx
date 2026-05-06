"use client"

import { Star } from "lucide-react"

export default function TestimonialSection() {
  return (
    <section className="bg-section-accent py-20 md:py-24 border-y border-border">
      <div className="container mx-auto px-6">
        <div className="mx-auto max-w-3xl text-center">
          <div className="flex justify-center gap-1 mb-6">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
            ))}
          </div>
          <blockquote className="text-xl font-medium text-foreground leading-relaxed md:text-2xl">
            "TitleWise cut our status update time from 15 minutes to 30 seconds. It's the first AI tool that actually understands what closing attorneys do."
          </blockquote>
          <div className="mt-6">
            <p className="font-semibold text-foreground text-sm">Sarah Mitchell</p>
            <p className="text-xs text-muted-foreground">Managing Partner, Mitchell & Associates</p>
          </div>
        </div>
      </div>
    </section>
  )
}
