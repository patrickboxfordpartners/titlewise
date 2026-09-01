"use client"

import { useEffect, useState } from "react"

export type ThemeColors = {
  primary: string
  primaryLight: string
  ink: string
  muted: string
  hairline: string
  canvasSoft: string
  bg: string
  cardBg: string
  cardBorder: string
  navBg: string
  sectionDark: string
  sectionDarkText: string
  sectionDarkMuted: string
  isDark: boolean
}

const LIGHT: ThemeColors = {
  primary: "#0066cc",
  primaryLight: "#e3f2fd",
  ink: "#0d253d",
  muted: "#64748d",
  hairline: "#e3e8ee",
  canvasSoft: "#f6f9fc",
  bg: "#ffffff",
  cardBg: "#ffffff",
  cardBorder: "#e3e8ee",
  navBg: "rgba(255,255,255,0.92)",
  sectionDark: "#0d253d",
  sectionDarkText: "#ffffff",
  sectionDarkMuted: "rgba(255,255,255,0.6)",
  isDark: false,
}

const DARK: ThemeColors = {
  primary: "#3b82f6",
  primaryLight: "rgba(59,130,246,0.12)",
  ink: "#EDEEF0",
  muted: "rgba(237,238,240,0.45)",
  hairline: "rgba(237,238,240,0.08)",
  canvasSoft: "#141820",
  bg: "#0f1219",
  cardBg: "#141820",
  cardBorder: "rgba(237,238,240,0.08)",
  navBg: "rgba(15,18,25,0.92)",
  sectionDark: "#0a0d12",
  sectionDarkText: "#EDEEF0",
  sectionDarkMuted: "rgba(237,238,240,0.45)",
  isDark: true,
}

export function useThemeColors(): ThemeColors {
  const [colors, setColors] = useState<ThemeColors>(LIGHT)

  useEffect(() => {
    function check() {
      const isDark = document.documentElement.classList.contains("dark")
      setColors(isDark ? DARK : LIGHT)
    }
    check()

    const observer = new MutationObserver(check)
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] })
    return () => observer.disconnect()
  }, [])

  return colors
}
