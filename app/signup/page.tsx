"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useUnsplashPhoto } from "@/hooks/useUnsplashPhoto"

export default function SignupPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [name, setName] = useState("")
  const [firmName, setFirmName] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const photo = useUnsplashPhoto()

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
    <div className="min-h-screen flex">
      {/* Left side - Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-[400px]">
          <div className="flex justify-center mb-14">
            <img src="/logo.svg" alt="TITLEwise" className="h-9 w-auto" />
          </div>

          <h1 className="text-[32px] font-bold text-gray-900 tracking-tight mb-2">
            Get started
          </h1>
          <p className="text-gray-500 text-[15px] mb-8">
            AI-powered tools for title attorneys
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full h-12 px-4 bg-gray-50 border border-gray-200 rounded-lg text-[15px] placeholder:text-gray-400 focus:bg-white focus:border-gray-300 focus:outline-none transition-colors"
                placeholder="Email address"
              />
            </div>

            <div>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full h-12 px-4 bg-gray-50 border border-gray-200 rounded-lg text-[15px] placeholder:text-gray-400 focus:bg-white focus:border-gray-300 focus:outline-none transition-colors"
                placeholder="Full name"
              />
            </div>

            <div>
              <input
                id="firmName"
                type="text"
                value={firmName}
                onChange={(e) => setFirmName(e.target.value)}
                className="w-full h-12 px-4 bg-gray-50 border border-gray-200 rounded-lg text-[15px] placeholder:text-gray-400 focus:bg-white focus:border-gray-300 focus:outline-none transition-colors"
                placeholder="Firm name"
              />
            </div>

            <div>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                className="w-full h-12 px-4 bg-gray-50 border border-gray-200 rounded-lg text-[15px] placeholder:text-gray-400 focus:bg-white focus:border-gray-300 focus:outline-none transition-colors"
                placeholder="Password (at least 8 characters)"
              />
            </div>

            {error && (
              <div className="text-red-600 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 text-[15px] font-medium bg-gray-900 text-white hover:bg-gray-800 rounded-lg transition-colors disabled:opacity-60"
            >
              {loading ? "Creating account..." : "Create account"}
            </button>
          </form>

          <div className="flex items-center gap-4 my-6">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-xs text-gray-400 uppercase">or</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          <p className="text-sm text-gray-500 text-center">
            Already have an account?{" "}
            <Link href="/login" className="text-gray-900 font-medium hover:underline">
              Log in
            </Link>
          </p>

          <p className="mt-10 text-xs text-gray-400 text-center">
            By continuing, you agree to our{" "}
            <Link href="/terms" className="underline hover:text-gray-500">
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link href="/privacy" className="underline hover:text-gray-500">
              Privacy Policy
            </Link>
          </p>
        </div>
      </div>

      {/* Right side - Photo */}
      <div className="hidden lg:block flex-1 relative overflow-hidden">
        <img
          src={photo.url}
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute bottom-4 right-4 text-white/70 text-xs">
          Photo by{" "}
          <a href={photo.photographerUrl} target="_blank" rel="noopener noreferrer" className="underline hover:text-white">
            {photo.photographer}
          </a>
          {" "}on{" "}
          <a href="https://unsplash.com?utm_source=boxford&utm_medium=referral" target="_blank" rel="noopener noreferrer" className="underline hover:text-white">
            Unsplash
          </a>
        </div>
      </div>
    </div>
  )
}
