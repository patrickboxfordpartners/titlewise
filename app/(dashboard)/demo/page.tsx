"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Upload, Loader2, FileText, CheckCircle, ArrowRight, Sparkles } from "lucide-react"

export default function DemoPage() {
  const router = useRouter()
  const [file, setFile] = useState<File | null>(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    const droppedFile = e.dataTransfer.files[0]
    if (droppedFile && droppedFile.type === "application/pdf") {
      setFile(droppedFile)
      setError(null)
    } else {
      setError("Please upload a PDF file")
    }
  }

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const selectedFile = e.target.files?.[0]
    if (selectedFile && selectedFile.type === "application/pdf") {
      setFile(selectedFile)
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

      const res = await fetch("/api/demo/analyze", {
        method: "POST",
        body: formData,
      })

      if (!res.ok) {
        throw new Error("Analysis failed")
      }

      const data = await res.json()
      setResult(data)
    } catch (err) {
      setError("Failed to analyze document. Please try again.")
    } finally {
      setAnalyzing(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl w-full"
      >
        {!result ? (
          <>
            {/* Header */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-4">
                <Sparkles className="h-8 w-8 text-primary" />
              </div>
              <h1 className="text-3xl font-bold text-foreground mb-2">
                See TitleWise in Action
              </h1>
              <p className="text-muted-foreground text-lg">
                Upload a closing document and watch the AI analyze it in real-time
              </p>
            </div>

            {/* Upload area */}
            <div
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              className="bg-card border-2 border-dashed border-border rounded-xl p-12 text-center mb-6 hover:border-primary/50 transition-colors"
            >
              {file ? (
                <div className="flex items-center justify-center gap-3">
                  <FileText className="h-8 w-8 text-primary" />
                  <div className="text-left">
                    <p className="text-sm font-semibold text-foreground">{file.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-base font-semibold text-foreground mb-2">
                    Drop your PDF here
                  </p>
                  <p className="text-sm text-muted-foreground mb-4">
                    or click to browse
                  </p>
                  <label className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors cursor-pointer">
                    Choose file
                    <input
                      type="file"
                      accept=".pdf"
                      onChange={handleFileInput}
                      className="hidden"
                    />
                  </label>
                </>
              )}
            </div>

            {/* Demo note */}
            <div className="bg-muted/50 border border-border rounded-lg p-4 mb-6">
              <p className="text-sm text-muted-foreground">
                <span className="font-semibold text-foreground">Try with patrickdocs.pdf</span> or any closing document.
                The AI will analyze it and extract key information automatically.
              </p>
            </div>

            {error && (
              <p className="text-sm text-red-500 mb-4 text-center">{error}</p>
            )}

            {/* Actions */}
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={handleAnalyze}
                disabled={!file || analyzing}
                className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white text-base font-semibold rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {analyzing ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-5 w-5" />
                    Analyze with AI
                  </>
                )}
              </button>
              <button
                onClick={() => router.push("/welcome")}
                className="px-6 py-3 text-base text-muted-foreground hover:text-foreground transition-colors"
              >
                Back
              </button>
            </div>
          </>
        ) : (
          <>
            {/* Results */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-green-500/10 mb-4">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <h1 className="text-3xl font-bold text-foreground mb-2">
                Analysis Complete
              </h1>
              <p className="text-muted-foreground">
                Here's what the AI found in your document
              </p>
            </div>

            {/* Results card */}
            <div className="bg-card border border-border rounded-xl p-6 mb-6">
              <div className="space-y-4">
                {result.findings && result.findings.length > 0 ? (
                  result.findings.map((finding: any, i: number) => (
                    <div key={i} className="pb-4 border-b border-border last:border-0 last:pb-0">
                      <p className="text-sm font-semibold text-foreground mb-1">{finding.title}</p>
                      <p className="text-sm text-muted-foreground">{finding.description}</p>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <p className="text-sm text-muted-foreground">
                      The AI processed your document successfully. In a real workflow, you'd see detailed analysis, extracted data, and actionable insights here.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* CTA */}
            <div className="text-center">
              <button
                onClick={() => router.push("/matters?new=1")}
                className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white text-base font-semibold rounded-lg hover:bg-primary/90 transition-colors"
              >
                Create Your First Matter
                <ArrowRight className="h-5 w-5" />
              </button>
              <button
                onClick={() => {
                  setFile(null)
                  setResult(null)
                  setError(null)
                }}
                className="block mx-auto mt-3 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Try another document
              </button>
            </div>
          </>
        )}
      </motion.div>
    </div>
  )
}
