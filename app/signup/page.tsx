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
      // Create account
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

      // Auto-login after signup
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        setError("Account created but login failed. Please try logging in.")
        router.push("/login")
      } else {
        router.push("/welcome?subscribed=false")
        router.refresh()
      }
    } catch (err) {
      setError("Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white relative overflow-hidden">
      {/* Blue gradient backdrop */}
      <div
        className="absolute top-0 left-0 right-0 z-0"
        style={{
          height: "40vh",
          background: "linear-gradient(90deg, #e3f2fd 0%, #90caf9 25%, #42a5f5 50%, #1e88e5 75%, #1565c0 100%)",
          filter: "blur(60px)",
          opacity: 0.3,
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/80 to-white z-0" />

      <div className="relative z-10 w-full max-w-md px-6">
        <div className="mb-8 flex justify-center">
          <Logo href="/" />
        </div>

        <div className="bg-white border border-[#e3e8ee] rounded-xl p-8 shadow-lg">
          <h1 className="text-2xl font-light tracking-tight text-[#0d253d] mb-2">
            Create your account
          </h1>
          <p className="text-sm font-light text-[#64748d] mb-6">
            Get started with TitleWise
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-light text-[#64748d] mb-1">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-3 py-2 border border-[#e3e8ee] rounded-lg font-light text-[#0d253d] focus:border-[#0066cc] focus:ring-1 focus:ring-[#0066cc] focus:outline-none"
                placeholder="you@firm.com"
              />
            </div>

            <div>
              <label htmlFor="name" className="block text-sm font-light text-[#64748d] mb-1">
                Full Name
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 border border-[#e3e8ee] rounded-lg font-light text-[#0d253d] focus:border-[#0066cc] focus:ring-1 focus:ring-[#0066cc] focus:outline-none"
                placeholder="John Smith"
              />
            </div>

            <div>
              <label htmlFor="firmName" className="block text-sm font-light text-[#64748d] mb-1">
                Firm Name
              </label>
              <input
                id="firmName"
                type="text"
                value={firmName}
                onChange={(e) => setFirmName(e.target.value)}
                className="w-full px-3 py-2 border border-[#e3e8ee] rounded-lg font-light text-[#0d253d] focus:border-[#0066cc] focus:ring-1 focus:ring-[#0066cc] focus:outline-none"
                placeholder="Smith Law Firm"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-light text-[#64748d] mb-1">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                className="w-full px-3 py-2 border border-[#e3e8ee] rounded-lg font-light text-[#0d253d] focus:border-[#0066cc] focus:ring-1 focus:ring-[#0066cc] focus:outline-none"
                placeholder="At least 8 characters"
              />
            </div>

            {error && (
              <div className="text-red-600 text-sm font-light">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#0066cc] hover:bg-[#0052a3] text-white font-normal rounded-full py-2 shadow-sm hover:shadow-md transition-all disabled:opacity-60"
            >
              {loading ? "Creating account..." : "Create account"}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm font-light text-[#64748d]">
              Already have an account?{" "}
              <Link href="/login" className="text-[#0066cc] hover:text-[#0052a3] font-normal">
                Log in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
