import Link from "next/link"
import { cn } from "@/lib/utils"

function LogoMark({ className, variant = "light" }: { className?: string; variant?: "light" | "dark" }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 36 43" fill="none" className={className}>
      <rect x="10" y="0" width="24" height="32" rx="4" fill={variant === "light" ? "#90caf9" : "#94a3b8"}/>
      <rect x="2" y="8" width="24" height="32" rx="4" fill="#0066cc"/>
    </svg>
  )
}

export function Logo({
  size = "default",
  href,
  variant = "light"
}: {
  size?: "sm" | "default";
  href?: string;
  variant?: "light" | "dark";
}) {
  const content = (
    <div className="flex items-center gap-2">
      <LogoMark
        className={cn(size === "sm" ? "h-6 w-auto" : "h-7 w-auto")}
        variant={variant}
      />
      <span className={size === "sm" ? "text-sm" : "text-lg"}>
        <span className={cn(
          "font-bold tracking-tight",
          variant === "light" ? "text-[#0d253d]" : "text-white"
        )}>
          TITLE
        </span>
        <span className={cn(
          "font-light ml-0.5",
          variant === "light" ? "text-[#64748d]" : "text-[#94a3b8]"
        )}>
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
