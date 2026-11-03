import { readFileSync } from "node:fs"
import path from "node:path"
import type { ReactNode } from "react"

/** Inline **bold** and [links](url) only; everything else is plain text. */
function inline(text: string): ReactNode[] {
  const out: ReactNode[] = []
  const re = /\*\*([^*]+)\*\*|\[([^\]]+)\]\(([^)]+)\)/g
  let last = 0
  let m: RegExpExecArray | null
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index))
    if (m[1]) out.push(<strong key={m.index}>{m[1]}</strong>)
    else out.push(<a key={m.index} href={m[3]} className="text-primary underline">{m[2]}</a>)
    last = re.lastIndex
  }
  if (last < text.length) out.push(text.slice(last))
  return out
}

/**
 * Render one of the agent-facing markdown files in public/ (about.md,
 * contact.md) as a server-rendered page, so humans and agents read the same copy.
 */
export default function MarkdownDoc({ file }: { file: string }) {
  const raw = readFileSync(path.join(process.cwd(), "public", file), "utf8")
  const body = raw.replace(/^---[\s\S]*?---\s*/, "")
  const blocks: ReactNode[] = []
  let list: string[] = []
  const flush = () => {
    if (list.length) {
      blocks.push(
        <ul key={`ul-${blocks.length}`} className="list-disc pl-5 space-y-1">
          {list.map((li, i) => <li key={i}>{inline(li)}</li>)}
        </ul>
      )
      list = []
    }
  }
  for (const line of body.split("\n")) {
    const t = line.trim()
    if (t.startsWith("- ")) { list.push(t.slice(2)); continue }
    flush()
    if (!t || t === "---") continue
    if (t.startsWith("# ")) blocks.push(<h1 key={blocks.length} className="text-5xl font-light tracking-[-1.4px] text-foreground">{t.slice(2)}</h1>)
    else if (t.startsWith("## ")) blocks.push(<h2 key={blocks.length} className="mt-10 mb-3 text-[22px] font-light text-foreground">{t.slice(3)}</h2>)
    else if (t.startsWith("### ")) blocks.push(<h3 key={blocks.length} className="mt-6 mb-2 text-lg font-normal text-foreground">{t.slice(4)}</h3>)
    else blocks.push(<p key={blocks.length}>{inline(t)}</p>)
  }
  flush()
  return <div className="space-y-4 text-foreground font-light leading-relaxed">{blocks}</div>
}
