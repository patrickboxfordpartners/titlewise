"use client"

import posthog from "posthog-js"
import { PostHogProvider } from "posthog-js/react"
import { useEffect } from "react"
import { useUser } from "@clerk/nextjs"

function PostHogIdentify() {
  const { user } = useUser()

  useEffect(() => {
    if (user) {
      posthog.identify(user.id, {
        email: user.primaryEmailAddress?.emailAddress,
        name: user.fullName ?? undefined,
      })
    } else {
      posthog.reset()
    }
  }, [user?.id])

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
