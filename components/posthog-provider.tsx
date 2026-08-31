"use client"

import posthog from "posthog-js"
import { PostHogProvider } from "posthog-js/react"
import { useEffect } from "react"
import { useSession } from "next-auth/react"

function PostHogIdentify() {
  const { data: session } = useSession()

  useEffect(() => {
    if (session?.user) {
      posthog.identify(session.user.id!, {
        email: session.user.email ?? undefined,
        name: session.user.name ?? undefined,
      })
    } else {
      posthog.reset()
    }
  }, [session?.user?.id])

  return null
}

export function PHProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    posthog.init("phc_S9m5GZ2t6EXZ4DAO4zbMHycBcWiJHefj5KR7SbJjy8l", {
      api_host: "https://us.i.posthog.com",
      person_profiles: "identified_only",
      capture_pageview: true,
      capture_pageleave: true,
    })
  }, [])

  return (
    <PostHogProvider client={posthog}>
      <PostHogIdentify />
      {children}
    </PostHogProvider>
  )
}
