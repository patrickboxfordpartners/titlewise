import Link from "next/link"
import { cn } from "@/lib/utils"

function LogoMark({ className, variant = "auto" }: { className?: string; variant?: "auto" | "light" | "dark" }) {
  const accentFill = variant === "dark" ? "#94a3b8" : variant === "light" ? "#90caf9" : "color-mix(in srgb, var(--primary) 40%, var(--foreground))"
  const primaryFill = "var(--primary, #0066cc)"
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 36 43" fill="none" className={className}>
      <rect x="10" y="0" width="24" height="32" rx="4" fill={accentFill}/>
      <rect x="2" y="8" width="24" height="32" rx="4" fill={primaryFill}/>
    </svg>
  )
}

export function Logo({
  size = "default",
  href,
  variant = "auto"
}: {
  size?: "sm" | "default";
  href?: string;
  variant?: "auto" | "light" | "dark";
}) {
  const titleColor = variant === "dark" ? "text-white" : variant === "light" ? "text-[#0d253d]" : "text-foreground"
  const wiseColor = variant === "dark" ? "text-[#94a3b8]" : variant === "light" ? "text-[#64748d]" : "text-muted-foreground"

  const content = (
    <div className="flex items-center gap-2">
      <LogoMark
        className={cn(size === "sm" ? "h-6 w-auto" : "h-7 w-auto")}
        variant={variant}
      />
      <span className={size === "sm" ? "text-sm" : "text-lg"}>
        <span className={cn("font-bold tracking-tight", titleColor)}>
          TITLE
        </span>
        <span className={cn("font-light ml-0.5", wiseColor)}>
          wise
        </span>
      </span>
    </div>
  )

  if (href) {
    return <Link href={href}>{content}</Link>
  }

  return content
}
