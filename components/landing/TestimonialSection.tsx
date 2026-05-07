"use client"

import { Star } from "lucide-react"

export default function TestimonialSection() {
  return (
    <section className="bg-section-accent py-20 md:py-24 border-y border-border">
      <div className="container mx-auto px-6">
        <div className="mx-auto text-center flex flex-col items-center" style={{ maxWidth: '800px' }}>
          <div className="flex justify-center gap-1 mb-6">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
            ))}
          </div>
          <p className="text-xl font-medium text-foreground leading-relaxed md:text-2xl w-full px-4">
            "TitleWise cut our status update time from 15 minutes to 30 seconds. It's the first AI tool that actually understands what closing attorneys do."
          </p>
          <div className="mt-6">
            <p className="font-semibold text-foreground text-sm">Sarah Mitchell</p>
            <p className="text-xs text-muted-foreground">Managing Partner, Mitchell & Associates</p>
          </div>
        </div>
      </div>
    </section>
  )
}
