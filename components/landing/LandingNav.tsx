"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Logo } from "@/components/logo"
import { useState, useEffect } from "react"

export default function LandingNav() {
  const [navScrolled, setNavScrolled] = useState(false)

  useEffect(() => {
    const handler = () => setNavScrolled(window.scrollY > 20)
    window.addEventListener("scroll", handler, { passive: true })
    return () => window.removeEventListener("scroll", handler)
  }, [])

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        navScrolled
          ? "border-b border-[#e3e8ee] bg-white/95 backdrop-blur-md shadow-sm"
          : "bg-white"
      }`}
    >
      <div className="container mx-auto flex h-16 items-center justify-between px-6">
        <Logo href="/" />
        <div className="flex items-center gap-4">
          <Link href="/blog" className="text-sm font-light text-[#64748d] hover:text-[#0d253d] transition-colors hidden sm:inline">
            Blog
          </Link>
          <Link href="/faq" className="text-sm font-light text-[#64748d] hover:text-[#0d253d] transition-colors hidden sm:inline">
            FAQ
          </Link>
          <Link href="/pricing" className="text-sm font-light text-[#64748d] hover:text-[#0d253d] transition-colors hidden sm:inline">
            Pricing
          </Link>
          <Link href="/demo" className="text-sm font-light text-[#64748d] hover:text-[#0d253d] transition-colors hidden sm:inline">
            Demo
          </Link>
          <Link href="/login" className="text-sm font-light text-[#64748d] hover:text-[#0d253d] transition-colors">
            Log in
          </Link>
          <Link href="/pricing">
            <Button size="sm">Get Started</Button>
          </Link>
        </div>
      </div>
    </nav>
  )
}
