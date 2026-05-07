import Link from "next/link"
import { cn } from "@/lib/utils"

function LogoMark({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 36 43" fill="none" className={className}>
      <rect x="10" y="0" width="24" height="32" rx="4" fill="#94a3b8"/>
      <rect x="2" y="8" width="24" height="32" rx="4" fill="#2563EB"/>
    </svg>
  )
}

export function Logo({ size = "default", href }: { size?: "sm" | "default"; href?: string }) {
  const content = (
    <div className="flex items-center gap-2">
      <LogoMark className={cn(size === "sm" ? "h-6 w-auto" : "h-7 w-auto")} />
      <span className={size === "sm" ? "text-sm" : "text-lg"}>
        <span className="font-bold tracking-tight text-foreground">TITLE</span>
        <span className="font-light text-muted-foreground ml-0.5">wise</span>
      </span>
    </div>
  )

  if (href) {
    return <Link href={href}>{content}</Link>
  }

  return content
}
