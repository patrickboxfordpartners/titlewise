import { FileText } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"

export function Logo({ size = "default", href }: { size?: "sm" | "default"; href?: string }) {
  const content = (
    <div className="flex items-center gap-2">
      <div className={cn(
        "flex items-center justify-center rounded-md bg-primary/10",
        size === "sm" ? "h-7 w-7" : "h-8 w-8"
      )}>
        <FileText className={cn("text-primary", size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4")} />
      </div>
      <span className={size === "sm" ? "text-sm" : "text-lg"}>
        <span className="font-extrabold tracking-tight text-foreground">TITLE</span>
        <span className="font-light text-muted-foreground ml-0.5">wise</span>
      </span>
    </div>
  )

  if (href) {
    return <Link href={href}>{content}</Link>
  }

  return content
}
