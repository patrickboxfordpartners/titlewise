"use client"

import { useState, useRef } from "react"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { Upload, Loader2, FileText, CheckCircle, ArrowRight, Sparkles, RotateCcw, X } from "lucide-react"
import ThemeToggle from "@/components/ThemeToggle"
import { useThemeColors } from "@/lib/useThemeColors"

type Finding = { title: string; description: string }

export default function TryPage() {
  const c = useThemeColors()
  const inputRef = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [result, setResult] = useState<Finding[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const [isDemo, setIsDemo] = useState(false)

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragOver(false)
    const f = e.dataTransfer.files[0]
    if (f?.type === "application/pdf") {
      setFile(f)
      setError(null)
    } else {
      setError("Please upload a PDF file")
    }
  }

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (f?.type === "application/pdf") {
      setFile(f)
      setError(null)
    } else {
      setError("Please upload a PDF file")
    }
  }

  async function handleAnalyze() {
    if (!file) return
    setAnalyzing(true)
    setError(null)
    try {
      const formData = new FormData()
      formData.append("file", file)
      const res = await fetch("/api/demo/analyze", { method: "POST", body: formData })
      if (!res.ok) throw new Error("Analysis failed")
      const data = await res.json()
      setResult(data.findings)
      if (data.demo) setIsDemo(true)
    } catch {
      setError("Analysis failed. Please try again.")
    } finally {
      setAnalyzing(false)
    }
  }

  function reset() {
    setFile(null)
    setResult(null)
    setError(null)
    setIsDemo(false)
    if (inputRef.current) inputRef.current.value = ""
  }

  const pill: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    padding: "12px 28px",
    borderRadius: 9999,
    fontSize: "0.9375rem",
    fontWeight: 500,
    cursor: "pointer",
    border: "none",
    transition: "all 0.15s ease",
  }

  return (
    <div
      style={{
        backgroundColor: c.bg,
        minHeight: "100vh",
        color: c.ink,
        fontWeight: 300,
        fontFeatureSettings: '"ss01"',
        WebkitFontSmoothing: "antialiased",
      }}
    >
      {/* Nav */}
      <nav
        style={{
          position: "sticky",
          top: 0,
          zIndex: 100,
          backgroundColor: c.navBg,
          backdropFilter: "blur(12px)",
          borderBottom: `1px solid ${c.hairline}`,
        }}
      >
        <div
          style={{
            padding: "0 32px",
            height: 64,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            maxWidth: 1200,
            margin: "0 auto",
          }}
        >
          <Link href="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 8 }}>
            <svg height="28" viewBox="0 0 36 43" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="10" y="0" width="24" height="32" rx="4" fill={c.isDark ? "rgba(255,255,255,0.25)" : "#93c5fd"} />
              <rect x="2" y="8" width="24" height="32" rx="4" fill={c.primary} />
            </svg>
            <span style={{ fontSize: "1.125rem", lineHeight: 1 }}>
              <span style={{ fontWeight: 700, color: c.ink, letterSpacing: "-0.01em" }}>TITLE</span>
              <span style={{ fontWeight: 300, color: c.muted }}>wise</span>
            </span>
          </Link>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <Link href="/demo" style={{ fontSize: "0.9375rem", fontWeight: 300, color: c.muted, textDecoration: "none" }}>Demo</Link>
            <Link href="/pricing" style={{ fontSize: "0.9375rem", fontWeight: 300, color: c.muted, textDecoration: "none" }}>Pricing</Link>
            <ThemeToggle />
            <Link
              href="/signup"
              style={{
                ...pill,
                padding: "8px 20px",
                backgroundColor: c.primary,
                color: "#fff",
                fontSize: "0.875rem",
                textDecoration: "none",
              }}
            >
              Get started
            </Link>
          </div>
        </div>
      </nav>

      {/* Main */}
      <div style={{ maxWidth: 680, margin: "0 auto", padding: "80px 24px 120px" }}>
        <AnimatePresence mode="wait">
          {!result ? (
            <motion.div
              key="upload"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              {/* Header */}
              <div style={{ textAlign: "center", marginBottom: 48 }}>
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: 64,
                    height: 64,
                    borderRadius: 16,
                    backgroundColor: c.isDark ? "rgba(59,130,246,0.12)" : "#e3f2fd",
                    marginBottom: 20,
                  }}
                >
                  <Sparkles size={28} color={c.primary} />
                </div>
                <h1
                  style={{
                    fontSize: "clamp(1.75rem, 4vw, 2.5rem)",
                    fontWeight: 300,
                    letterSpacing: "-0.64px",
                    lineHeight: 1.1,
                    marginBottom: 12,
                  }}
                >
                  Try TITLEwise
                </h1>
                <p style={{ fontSize: "1.125rem", color: c.muted, fontWeight: 300, maxWidth: 440, margin: "0 auto" }}>
                  Upload a closing document and watch the AI analyze it in real time.
                </p>
              </div>

              {/* Drop zone */}
              <div
                onDrop={handleDrop}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
                onDragLeave={() => setDragOver(false)}
                onClick={() => !file && inputRef.current?.click()}
                style={{
                  border: `2px dashed ${dragOver ? c.primary : c.hairline}`,
                  borderRadius: 16,
                  padding: file ? "32px" : "56px 32px",
                  textAlign: "center",
                  backgroundColor: dragOver
                    ? (c.isDark ? "rgba(59,130,246,0.06)" : "#f0f7ff")
                    : c.cardBg,
                  transition: "all 0.2s ease",
                  cursor: file ? "default" : "pointer",
                  marginBottom: 24,
                }}
              >
                {file ? (
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12 }}>
                    <FileText size={24} color={c.primary} />
                    <div style={{ textAlign: "left" }}>
                      <p style={{ fontSize: "0.9375rem", fontWeight: 500, marginBottom: 2 }}>{file.name}</p>
                      <p style={{ fontSize: "0.8125rem", color: c.muted }}>{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); reset() }}
                      style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        padding: 4,
                        color: c.muted,
                        marginLeft: 8,
                      }}
                    >
                      <X size={18} />
                    </button>
                  </div>
                ) : (
                  <>
                    <Upload size={36} color={c.muted} style={{ marginBottom: 16 }} />
                    <p style={{ fontSize: "1rem", fontWeight: 500, marginBottom: 6 }}>Drop a PDF here</p>
                    <p style={{ fontSize: "0.875rem", color: c.muted }}>or click to browse</p>
                  </>
                )}
                <input
                  ref={inputRef}
                  type="file"
                  accept=".pdf"
                  onChange={handleFileInput}
                  style={{ display: "none" }}
                />
              </div>

              {/* Hint */}
              <div
                style={{
                  backgroundColor: c.canvasSoft,
                  border: `1px solid ${c.hairline}`,
                  borderRadius: 12,
                  padding: "14px 18px",
                  marginBottom: 24,
                }}
              >
                <p style={{ fontSize: "0.8125rem", color: c.muted, lineHeight: 1.5 }}>
                  <span style={{ fontWeight: 500, color: c.ink }}>Works best with</span> title commitments, closing disclosures, purchase/sale agreements, or any real estate closing document.
                </p>
              </div>

              {error && (
                <p style={{ fontSize: "0.875rem", color: "#ef4444", textAlign: "center", marginBottom: 16 }}>{error}</p>
              )}

              {/* Actions */}
              <div style={{ display: "flex", justifyContent: "center", gap: 12 }}>
                <button
                  onClick={handleAnalyze}
                  disabled={!file || analyzing}
                  style={{
                    ...pill,
                    backgroundColor: !file || analyzing ? (c.isDark ? "rgba(59,130,246,0.3)" : "#93c5fd") : c.primary,
                    color: "#fff",
                    opacity: !file || analyzing ? 0.7 : 1,
                    cursor: !file || analyzing ? "not-allowed" : "pointer",
                  }}
                >
                  {analyzing ? (
                    <>
                      <Loader2 size={18} style={{ animation: "spin 1s linear infinite" }} />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Sparkles size={18} />
                      Analyze with AI
                    </>
                  )}
                </button>
              </div>

              <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
            </motion.div>
          ) : (
            <motion.div
              key="results"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              {/* Results header */}
              <div style={{ textAlign: "center", marginBottom: 40 }}>
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: 64,
                    height: 64,
                    borderRadius: 16,
                    backgroundColor: c.isDark ? "rgba(34,197,94,0.12)" : "#dcfce7",
                    marginBottom: 20,
                  }}
                >
                  <CheckCircle size={28} color="#22c55e" />
                </div>
                <h1
                  style={{
                    fontSize: "clamp(1.75rem, 4vw, 2.5rem)",
                    fontWeight: 300,
                    letterSpacing: "-0.64px",
                    lineHeight: 1.1,
                    marginBottom: 12,
                  }}
                >
                  Analysis complete
                </h1>
                <p style={{ fontSize: "1.125rem", color: c.muted, fontWeight: 300 }}>
                  Here is what the AI found in <span style={{ fontWeight: 500, color: c.ink }}>{file?.name}</span>
                </p>
              </div>

              {/* Findings */}
              <div
                style={{
                  backgroundColor: c.cardBg,
                  border: `1px solid ${c.cardBorder}`,
                  borderRadius: 16,
                  overflow: "hidden",
                  marginBottom: 32,
                }}
              >
                {result.map((finding, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    style={{
                      padding: "20px 24px",
                      borderBottom: i < result.length - 1 ? `1px solid ${c.hairline}` : "none",
                    }}
                  >
                    <p style={{ fontSize: "0.875rem", fontWeight: 600, marginBottom: 4, color: c.ink }}>
                      {finding.title}
                    </p>
                    <p style={{ fontSize: "0.875rem", color: c.muted, lineHeight: 1.5 }}>
                      {finding.description}
                    </p>
                  </motion.div>
                ))}
              </div>

              {isDemo && (
                <p style={{ fontSize: "0.75rem", color: c.muted, textAlign: "center", marginBottom: 16, fontStyle: "italic" }}>
                  Sample analysis shown. With a subscription, your actual documents are analyzed by AI in real time.
                </p>
              )}

              {/* CTAs */}
              <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 12 }}>
                <Link
                  href="/signup"
                  style={{
                    ...pill,
                    backgroundColor: c.primary,
                    color: "#fff",
                    border: `1px solid ${c.primary}`,
                    textDecoration: "none",
                  }}
                >
                  Get started
                  <ArrowRight size={18} />
                </Link>
                <button
                  onClick={reset}
                  style={{
                    ...pill,
                    backgroundColor: "transparent",
                    color: c.muted,
                    border: `1px solid ${c.hairline}`,
                  }}
                >
                  <RotateCcw size={16} />
                  Try another document
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
