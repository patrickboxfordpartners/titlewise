"use client"

import { useEffect, useState, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Loader2, CheckCircle, AlertCircle } from "lucide-react"

function JoinContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const token = searchParams.get("token")
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading")
  const [message, setMessage] = useState("")

  useEffect(() => {
    if (!token) {
      setStatus("error")
      setMessage("Invalid invitation link.")
      return
    }

    fetch("/api/team/join", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    })
      .then(r => r.json())
      .then(data => {
        if (data.ok || data.alreadyAccepted) {
          setStatus("success")
          setTimeout(() => router.push("/dashboard"), 1500)
        } else {
          setStatus("error")
          setMessage(data.error ?? "Failed to accept invitation.")
        }
      })
      .catch(() => {
        setStatus("error")
        setMessage("Something went wrong. Please try again.")
      })
  }, [token, router])

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="text-center max-w-sm">
        {status === "loading" && (
          <>
            <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
            <p className="text-sm text-muted-foreground">Accepting invitation...</p>
          </>
        )}
        {status === "success" && (
          <>
            <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-foreground mb-2">Welcome to TITLEwise</h2>
            <p className="text-sm text-muted-foreground">Redirecting you to your workspace...</p>
          </>
        )}
        {status === "error" && (
          <>
            <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-foreground mb-2">Invitation Error</h2>
            <p className="text-sm text-muted-foreground">{message}</p>
            <a href="/sign-in" className="mt-4 inline-block text-xs text-primary hover:underline">
              Go to sign in
            </a>
          </>
        )}
      </div>
    </div>
  )
}

export default function JoinPage() {
  return (
    <Suspense>
      <JoinContent />
    </Suspense>
  )
}
