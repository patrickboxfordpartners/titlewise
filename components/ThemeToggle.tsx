"use client"

import { useSyncExternalStore } from "react"

const listeners = new Set<() => void>()

/** Register a theme listener and return a callback that removes it. */
function subscribe(callback: () => void) {
  listeners.add(callback)
  return () => listeners.delete(callback)
}

/** Read whether the document currently uses the dark theme. */
function getSnapshot() {
  return document.documentElement.classList.contains("dark")
}

/** Return the light theme snapshot used during server rendering and hydration. */
function getServerSnapshot() {
  return false
}

/** Notify subscribed theme controls after the theme changes. */
function emit() {
  listeners.forEach((listener) => listener())
}

/** Render a theme switch synchronized with the document theme store. */
export default function ThemeToggle({ className }: { className?: string }) {
  const dark = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)

  /** Toggle the document theme, persist the choice, and notify subscribers. */
  function toggle() {
    const next = !dark
    document.documentElement.classList.toggle("dark", next)
    localStorage.setItem("tw-theme", next ? "dark" : "light")
    emit()
  }

  return (
    <button
      onClick={toggle}
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
      className={className}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: 32,
        height: 32,
        borderRadius: 8,
        border: "1px solid var(--border)",
        background: "transparent",
        cursor: "pointer",
        color: "var(--text-muted)",
        transition: "all 0.15s",
      }}
    >
      {dark ? (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="5" />
          <line x1="12" y1="1" x2="12" y2="3" />
          <line x1="12" y1="21" x2="12" y2="23" />
          <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
          <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
          <line x1="1" y1="12" x2="3" y2="12" />
          <line x1="21" y1="12" x2="23" y2="12" />
          <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
          <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
        </svg>
      ) : (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
      )}
    </button>
  )
}
