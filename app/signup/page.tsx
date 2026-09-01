"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Logo } from "@/components/logo"

export default function SignupPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [name, setName] = useState("")
  const [firmName, setFirmName] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const signupRes = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, name, firmName })
      })

      const signupData = await signupRes.json()

      if (!signupRes.ok) {
        setError(signupData.error || "Failed to create account")
        setLoading(false)
        return
      }

      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        setError("Account created but login failed. Please try logging in.")
        router.push("/login")
      } else {
        router.push("/pricing")
        router.refresh()
      }
    } catch (err) {
      setError("Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden" style={{ backgroundColor: "var(--background)" }}>
      {/* Blue gradient backdrop */}
      <div
        className="absolute top-0 left-0 right-0 z-0"
        style={{
          height: "40vh",
          background: "linear-gradient(90deg, color-mix(in srgb, var(--primary) 15%, var(--background)), color-mix(in srgb, var(--primary) 40%, var(--background)), color-mix(in srgb, var(--primary) 60%, var(--background)))",
          filter: "blur(60px)",
          opacity: 0.5,
        }}
      />
      <div className="absolute inset-0 z-0" style={{ background: `linear-gradient(to bottom, transparent, var(--background) 70%)` }} />

      <div className="relative z-10 w-full max-w-md px-6">
        <div className="mb-8 flex justify-center">
          <Logo href="/" />
        </div>

        <div className="bg-card border border-border rounded-xl p-8 shadow-lg">
          <h1 className="text-2xl font-light tracking-tight text-foreground mb-2">
            Create your account
          </h1>
          <p className="text-sm font-light text-muted-foreground mb-6">
            Get started with TITLEwise
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-light text-muted-foreground mb-1">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-3 py-2 border border-border rounded-lg font-light text-foreground bg-input focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none placeholder:text-muted-foreground/50"
                placeholder="you@firm.com"
              />
            </div>

            <div>
              <label htmlFor="name" className="block text-sm font-light text-muted-foreground mb-1">
                Full Name
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-lg font-light text-foreground bg-input focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none placeholder:text-muted-foreground/50"
                placeholder="John Smith"
              />
            </div>

            <div>
              <label htmlFor="firmName" className="block text-sm font-light text-muted-foreground mb-1">
                Firm Name
              </label>
              <input
                id="firmName"
                type="text"
                value={firmName}
                onChange={(e) => setFirmName(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-lg font-light text-foreground bg-input focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none placeholder:text-muted-foreground/50"
                placeholder="Smith Law Firm"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-light text-muted-foreground mb-1">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                className="w-full px-3 py-2 border border-border rounded-lg font-light text-foreground bg-input focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none placeholder:text-muted-foreground/50"
                placeholder="At least 8 characters"
              />
            </div>

            {error && (
              <div className="text-destructive text-sm font-light">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-normal rounded-full py-2 shadow-sm hover:shadow-md transition-all disabled:opacity-60"
            >
              {loading ? "Creating account..." : "Create account"}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm font-light text-muted-foreground">
              Already have an account?{" "}
              <Link href="/login" className="text-primary hover:text-primary/80 font-normal">
                Log in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
