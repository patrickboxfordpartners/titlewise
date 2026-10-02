"use client"

import { useState, useMemo } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"

const PHOTOS = [
  "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?q=80&w=2070&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?q=80&w=2074&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1501785888041-af3ef285b470?q=80&w=2070&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1472214103451-9374bd1c798e?q=80&w=2070&auto=format&fit=crop",
]

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const photo = useMemo(() => PHOTOS[Math.floor(Math.random() * PHOTOS.length)], [])

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
    <div className="min-h-screen flex">
      {/* Left side - Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-[400px]">
          <div className="flex justify-center mb-14">
            <img src="/logo.svg" alt="TITLEwise" className="h-9 w-auto" />
          </div>

          <h1 className="text-[32px] font-bold text-gray-900 tracking-tight mb-2">
            Welcome back
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
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full h-12 px-4 bg-gray-50 border border-gray-200 rounded-lg text-[15px] placeholder:text-gray-400 focus:bg-white focus:border-gray-300 focus:outline-none transition-colors"
                placeholder="Password"
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
              {loading ? "Logging in..." : "Log in"}
            </button>
          </form>

          <div className="flex items-center gap-4 my-6">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-xs text-gray-400 uppercase">or</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          <p className="text-sm text-gray-500 text-center">
            Don't have an account?{" "}
            <Link href="/signup" className="text-gray-900 font-medium hover:underline">
              Sign up
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
          src={photo}
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
        />
      </div>
    </div>
  )
}
