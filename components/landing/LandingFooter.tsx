import Link from "next/link"
import { Logo } from "@/components/logo"

export default function LandingFooter() {
  return (
    <footer className="border-t border-border bg-secondary/30">
      <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
        <div className="grid gap-12 text-center md:grid-cols-4 md:text-left">
          {/* Brand */}
          <div className="md:col-span-1">
            <div className="flex justify-center md:justify-start mb-3">
              <Logo size="default" href="/" />
            </div>
            <a
              href="https://www.boxfordpartners.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block px-3 py-1.5 mb-4 border border-border rounded text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-widest hover:border-foreground/30 hover:text-muted-foreground transition-colors"
            >
              A Boxford Partners Company
            </a>
            <p>
              <a
                href="mailto:hello@titlewise.app"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                hello@titlewise.app
              </a>
            </p>
          </div>

          {/* Product */}
          <div>
            <h4 className="mb-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Product
            </h4>
            <ul className="space-y-3 text-sm">
              <li>
                <Link href="/#features" className="text-muted-foreground hover:text-foreground transition-colors">
                  Features
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="text-muted-foreground hover:text-foreground transition-colors">
                  Pricing
                </Link>
              </li>
              <li>
                <Link href="/sign-in" className="text-muted-foreground hover:text-foreground transition-colors">
                  Dashboard
                </Link>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="mb-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Company
            </h4>
            <ul className="space-y-3 text-sm">
              <li>
                <a
                  href="https://www.boxfordpartners.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  About
                </a>
              </li>
              <li>
                <a href="mailto:hello@titlewise.app" className="text-muted-foreground hover:text-foreground transition-colors">
                  Support
                </a>
              </li>
              <li>
                <a href="mailto:hello@titlewise.app" className="text-muted-foreground hover:text-foreground transition-colors">
                  Contact
                </a>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="mb-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Legal
            </h4>
            <ul className="space-y-3 text-sm">
              <li>
                <Link href="/privacy" className="text-muted-foreground hover:text-foreground transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-muted-foreground hover:text-foreground transition-colors">
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-16 border-t border-border pt-6">
          <p className="text-xs text-muted-foreground/50">
            © {new Date().getFullYear()} Boxford Partners LLC DBA TITLEWISE. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
