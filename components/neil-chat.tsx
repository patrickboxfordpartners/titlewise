"use client"

import { useEffect, useRef, useState } from "react"
import { useSession } from "next-auth/react"
import { MessageSquare, X } from "lucide-react"
import { cn } from "@/lib/utils"

type Message = {
  id: string
  role: "user" | "assistant"
  content: string
  toolEvents?: Array<{ name: string; summary: string }>
}

export default function NeilChat({ matterId }: { matterId: string }) {
  const { data: session } = useSession()
  const [open, setOpen] = useState(() => {
    if (typeof window === "undefined") return false
    return localStorage.getItem("neil-panel-open") === "true"
  })
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [streaming, setStreaming] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    localStorage.setItem("neil-panel-open", String(open))
  }, [open])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, streaming])

  async function sendMessage() {
    const text = input.trim()
    if (!text || streaming) return

    const userMsg: Message = { id: crypto.randomUUID(), role: "user", content: text }
    setMessages(prev => [...prev, userMsg])
    setInput("")
    setStreaming(true)

    const assistantId = crypto.randomUUID()
    setMessages(prev => [...prev, { id: assistantId, role: "assistant", content: "", toolEvents: [] }])

    try {
      const res = await fetch("/api/chat/stream", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ matterId, message: text }),
      })

      if (!res.ok) {
        const err = await res.json()
        setMessages(prev => prev.map(m =>
          m.id === assistantId ? { ...m, content: err.error || "Something went wrong." } : m
        ))
        setStreaming(false)
        return
      }

      const reader = res.body!.getReader()
      const decoder = new TextDecoder()
      let buffer = ""

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split("\n")
        buffer = lines.pop()!

        let eventType = ""
        for (const line of lines) {
          if (line.startsWith("event: ")) {
            eventType = line.slice(7)
          } else if (line.startsWith("data: ")) {
            const data = JSON.parse(line.slice(6))

            if (eventType === "token") {
              setMessages(prev => prev.map(m =>
                m.id === assistantId ? { ...m, content: m.content + data.content } : m
              ))
            } else if (eventType === "tool_start") {
              setMessages(prev => prev.map(m =>
                m.id === assistantId ? {
                  ...m,
                  toolEvents: [...(m.toolEvents || []), { name: data.name, summary: "Running..." }],
                } : m
              ))
            } else if (eventType === "tool_result") {
              setMessages(prev => prev.map(m =>
                m.id === assistantId ? {
                  ...m,
                  toolEvents: (m.toolEvents || []).map(te =>
                    te.name === data.name && te.summary === "Running..."
                      ? { ...te, summary: data.summary }
                      : te
                  ),
                } : m
              ))
            }
          }
        }
      }
    } catch {
      setMessages(prev => prev.map(m =>
        m.id === assistantId ? { ...m, content: "Connection lost. Try again." } : m
      ))
    } finally {
      setStreaming(false)
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-50 w-12 h-12 bg-primary text-white rounded-full shadow-lg flex items-center justify-center hover:bg-primary/90 transition-colors"
        aria-label="Open Neil chat"
      >
        <MessageSquare className="h-5 w-5" />
      </button>
    )
  }

  return (
    <div className="fixed top-0 right-0 z-50 h-full w-[380px] border-l border-border bg-background flex flex-col shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
            <MessageSquare className="h-3.5 w-3.5 text-primary" />
          </div>
          <span className="text-sm font-semibold text-foreground">Neil</span>
        </div>
        <button
          onClick={() => setOpen(false)}
          className="text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Close Neil chat"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center py-8">
            <p className="text-sm text-muted-foreground">Ask Neil about this matter...</p>
          </div>
        )}
        {messages.map(msg => (
          <div key={msg.id} className={cn("flex", msg.role === "user" ? "justify-end" : "justify-start")}>
            <div className={cn(
              "max-w-[85%] rounded-xl px-3 py-2 text-sm",
              msg.role === "user"
                ? "bg-primary text-white"
                : "bg-muted text-foreground",
            )}>
              {msg.toolEvents && msg.toolEvents.length > 0 && (
                <div className="mb-2 space-y-1">
                  {msg.toolEvents.map((te, i) => (
                    <div key={i} className="text-[10px] text-muted-foreground bg-background/50 rounded px-2 py-1">
                      <span className="font-medium">{te.name}</span>: {te.summary}
                    </div>
                  ))}
                </div>
              )}
              <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="shrink-0 border-t border-border px-4 py-3">
        <div className="flex gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault()
                sendMessage()
              }
            }}
            placeholder="Ask Neil about this matter..."
            rows={1}
            className="flex-1 resize-none text-sm bg-muted border border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary placeholder:text-muted-foreground/50"
            disabled={streaming}
          />
          <button
            onClick={sendMessage}
            disabled={streaming || !input.trim()}
            className="px-3 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors shrink-0"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  )
}
