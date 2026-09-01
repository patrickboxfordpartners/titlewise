"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Logo } from "@/components/logo"

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        setError("Invalid email or password")
      } else {
        router.push("/dashboard")
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
            Welcome back
          </h1>
          <p className="text-sm font-light text-muted-foreground mb-6">
            Log in to your TITLEwise account
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
              <label htmlFor="password" className="block text-sm font-light text-muted-foreground mb-1">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-3 py-2 border border-border rounded-lg font-light text-foreground bg-input focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none placeholder:text-muted-foreground/50"
                placeholder="Enter your password"
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
              {loading ? "Logging in..." : "Log in"}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm font-light text-muted-foreground">
              Don't have an account?{" "}
              <Link href="/signup" className="text-primary hover:text-primary/80 font-normal">
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
