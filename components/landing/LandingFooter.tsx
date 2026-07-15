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
              <li>
                <Link href="/blog" className="text-muted-foreground hover:text-foreground transition-colors">
                  Blog
                </Link>
              </li>
              <li>
                <Link href="/faq" className="text-muted-foreground hover:text-foreground transition-colors">
                  FAQ
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

        <div className="mt-16 border-t border-border pt-6 flex items-center justify-between">
          <p className="text-xs text-muted-foreground/50">
            © {new Date().getFullYear()} Boxford Partners LLC DBA TITLEWISE. All rights reserved.
          </p>
          <a
            href="https://www.linkedin.com/company/boxfordpartners"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Boxford Partners on LinkedIn"
            className="text-muted-foreground/40 hover:text-muted-foreground transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
            </svg>
          </a>
        </div>
      </div>
    </footer>
  )
}
