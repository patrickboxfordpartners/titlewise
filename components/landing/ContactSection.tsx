"use client"

import { useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Send, CheckCircle2, ArrowLeft } from "lucide-react"

export default function ContactSection() {
  const [form, setForm] = useState({ name: "", email: "", firm: "", message: "" })
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
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
    setTimeout(() => {
      setSubmitting(false)
      setSubmitted(true)
    }, 800)
  }

  const handleReset = () => {
    setForm({ name: "", email: "", firm: "", message: "" })
    setSubmitted(false)
  }

  return (
    <section id="contact" className="bg-section-alt py-20 md:py-28">
      <div className="container mx-auto px-6">
        <div className="mx-auto grid max-w-5xl gap-12 md:grid-cols-2 md:items-center">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-3xl font-bold text-foreground tracking-tight md:text-4xl">
              Request a Demo
            </h2>
            <p className="mt-4 text-muted-foreground leading-relaxed">
              See how TITLEwise can streamline your real estate practice. Fill out the form and our team will reach out within 1 business day.
            </p>
            <div className="mt-8 space-y-4">
              {[
                "Personalized walkthrough of all 8 tools",
                "Tailored to your firm's workflow",
                "No obligation — just answers",
              ].map((item) => (
                <div key={item} className="flex items-center gap-3">
                  <div className="h-2 w-2 rounded-full bg-primary shrink-0" />
                  <span className="text-sm text-foreground">{item}</span>
                </div>
              ))}
            </div>
          </motion.div>

          <AnimatePresence mode="wait">
            {submitted ? (
              <motion.div
                key="success"
                className="rounded-xl border border-border bg-card p-8 md:p-10 shadow-sm flex flex-col items-center text-center"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring", stiffness: 200, damping: 12 }}
                >
                  <CheckCircle2 className="h-16 w-16 text-primary" strokeWidth={1.5} />
                </motion.div>
                <motion.h3
                  className="mt-5 text-2xl font-bold text-foreground"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.35 }}
                >
                  Thank You!
                </motion.h3>
                <motion.p
                  className="mt-2 text-muted-foreground max-w-sm"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.45 }}
                >
                  Your demo request has been received. Our team will reach out within 1 business day to schedule your personalized walkthrough.
                </motion.p>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 }}
                >
                  <Button variant="outline" className="mt-6" onClick={handleReset}>
                    <ArrowLeft className="mr-1 h-4 w-4" /> Submit Another Request
                  </Button>
                </motion.div>
              </motion.div>
            ) : (
              <motion.form
                key="form"
                onSubmit={handleSubmit}
                className="rounded-xl border border-border bg-card p-6 md:p-8 space-y-4 shadow-sm"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-foreground">
                      Name <span className="text-destructive">*</span>
                    </label>
                    <Input
                      placeholder="Jane Smith"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      maxLength={100}
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-foreground">
                      Email <span className="text-destructive">*</span>
                    </label>
                    <Input
                      type="email"
                      placeholder="jane@smithlaw.com"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      maxLength={255}
                    />
                  </div>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-foreground">
                    Firm Name
                  </label>
                  <Input
                    placeholder="Smith & Associates"
                    value={form.firm}
                    onChange={(e) => setForm({ ...form, firm: e.target.value })}
                    maxLength={150}
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-foreground">
                    Message <span className="text-destructive">*</span>
                  </label>
                  <Textarea
                    placeholder="Tell us about your practice and what you'd like to see in the demo..."
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                    maxLength={1000}
                    rows={4}
                  />
                </div>
                {error && <p className="text-xs text-destructive">{error}</p>}
                <Button type="submit" variant="hero" className="w-full" size="lg" disabled={submitting}>
                  {submitting ? "Sending..." : <><Send className="mr-1 h-4 w-4" /> Send Request</>}
                </Button>
                <p className="text-center text-xs text-muted-foreground">
                  We'll never share your information with third parties.
                </p>
              </motion.form>
            )}
          </AnimatePresence>
        </div>
      </div>
    </section>
  )
}
