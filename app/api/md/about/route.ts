import { NextResponse } from "next/server"

export const dynamic = "force-static"

const CONTENT = `---
title: About TITLEwise  
description: AI-powered platform for real estate closing attorneys, built by Boxford Partners
canonical: https://titlewise.app/about
last-updated: 2026-08-27
---

# About TITLEwise

AI-powered platform for real estate closing attorneys. Built by Boxford Partners in San Francisco.`

export function GET() {
  return new NextResponse(CONTENT, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  })
}
