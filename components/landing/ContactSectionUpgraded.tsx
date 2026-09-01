"use client"

import { useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Send, CheckCircle2, ArrowLeft } from "lucide-react"

export default function ContactSectionUpgraded() {
  const [form, setForm] = useState({ name: "", email: "", firm: "", message: "" })
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    const trimmed = {
      name: form.name.trim(),
      email: form.email.trim(),
      firm: form.firm.trim(),
      message: form.message.trim(),
    }

    if (!trimmed.name || !trimmed.email || !trimmed.message) {
      setError("Please fill in all required fields.")
      return
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed.email)) {
      setError("Please enter a valid email address.")
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(trimmed),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Failed to submit")
      }

      setSubmitted(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  const handleReset = () => {
    setForm({ name: "", email: "", firm: "", message: "" })
    setSubmitted(false)
  }

  return (
    <section id="contact" className="bg-section-alt py-20 md:py-24 scroll-mt-20">
      <div className="container mx-auto px-6">
        <div className="mx-auto grid max-w-6xl gap-16 lg:grid-cols-2 lg:items-start">
          <div className="lg:sticky lg:top-32">
            <h2 className="text-4xl font-black text-foreground tracking-tighter md:text-5xl">
              Request a Demo
            </h2>
            <p className="mt-4 text-muted-foreground leading-relaxed max-w-[65ch]">
              See how TITLEwise can streamline your real estate practice. Fill out the form and our team will reach out within 1 business day.
            </p>

            <div className="mt-10 space-y-5">
              {[
                "Personalized walkthrough of all 12 tools",
                "Tailored to your firm's workflow",
                "No obligation—just answers",
              ].map((item) => (
                <div key={item} className="flex items-start gap-4">
                  <div className="shrink-0 mt-1 h-1.5 w-1.5 rounded-full bg-primary" />
                  <span className="text-sm text-foreground leading-relaxed">{item}</span>
                </div>
              ))}
            </div>

            <div className="mt-12 rounded-2xl border border-border bg-card/50 backdrop-blur-sm p-6">
              <p className="text-xs text-muted-foreground leading-relaxed">
                Your information is never shared with third parties. We take privacy seriously and comply with all legal data protection standards.
              </p>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {submitted ? (
              <motion.div
                key="success"
                className="rounded-[2rem] border border-border bg-card p-10 md:p-12 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] flex flex-col items-center text-center"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              >
                <div className="rounded-full bg-primary/10 p-4">
                  <CheckCircle2 className="h-12 w-12 text-primary" strokeWidth={1.5} />
                </div>
                <h3 className="mt-6 text-2xl font-bold text-foreground tracking-tight">
                  Thank You
                </h3>
                <p className="mt-3 text-muted-foreground max-w-sm leading-relaxed">
                  Your demo request has been received. Our team will reach out within 1 business day to schedule your personalized walkthrough.
                </p>
                <Button
                  variant="outline"
                  className="mt-8 active:translate-y-[1px]"
                  onClick={handleReset}
                >
                  <ArrowLeft className="mr-1.5 h-4 w-4" strokeWidth={2} />
                  Submit Another Request
                </Button>
              </motion.div>
            ) : (
              <form
                onSubmit={handleSubmit}
                className="rounded-[2rem] border border-border bg-card p-8 md:p-10 space-y-6 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)]"
              >
                <div className="space-y-6">
                  <div>
                    <label className="block text-xs font-medium text-foreground tracking-wide uppercase mb-2">
                      Name <span className="text-destructive">*</span>
                    </label>
                    <Input
                      placeholder="Jane Smith"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      maxLength={100}
                      className="h-11"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-foreground tracking-wide uppercase mb-2">
                      Email <span className="text-destructive">*</span>
                    </label>
                    <Input
                      type="email"
                      placeholder="jane@smithlaw.com"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      maxLength={255}
                      className="h-11"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-foreground tracking-wide uppercase mb-2">
                      Firm Name
                    </label>
                    <Input
                      placeholder="Smith & Associates"
                      value={form.firm}
                      onChange={(e) => setForm({ ...form, firm: e.target.value })}
                      maxLength={150}
                      className="h-11"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-foreground tracking-wide uppercase mb-2">
                      Message <span className="text-destructive">*</span>
                    </label>
                    <Textarea
                      placeholder="Tell us about your practice and what you'd like to see in the demo..."
                      value={form.message}
                      onChange={(e) => setForm({ ...form, message: e.target.value })}
                      maxLength={1000}
                      rows={4}
                      className="resize-none"
                    />
                  </div>
                </div>

                {error && (
                  <p className="text-xs text-destructive">{error}</p>
                )}

                <Button
                  type="submit"
                  variant="hero"
                  className="w-full active:translate-y-[1px]"
                  size="lg"
                  disabled={submitting}
                >
                  {submitting ? (
                    "Sending..."
                  ) : (
                    <>
                      <Send className="mr-1.5 h-4 w-4" strokeWidth={2} />
                      Send Request
                    </>
                  )}
                </Button>
              </form>
            )}
          </AnimatePresence>
        </div>
      </div>
    </section>
  )
}
