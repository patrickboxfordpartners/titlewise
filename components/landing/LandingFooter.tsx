import Link from "next/link"
import { Logo } from "@/components/logo"

export default function LandingFooter() {
  return (
    <footer className="border-t border-border bg-background py-8">
      <div className="container mx-auto flex items-center justify-between px-6">
        <Logo size="sm" href="/" />
        <div className="flex items-center gap-6">
          <Link href="/pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            Pricing
          </Link>
          <Link href="/sign-in" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            Sign In
          </Link>
        </div>
      </div>
    </footer>
  )
}
