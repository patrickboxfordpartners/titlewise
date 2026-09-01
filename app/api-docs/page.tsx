"use client"

import { useEffect, useRef } from "react"
import SwaggerUI from "swagger-ui-react"
import "swagger-ui-react/swagger-ui.css"

export default function APIDocsPage() {
  const swaggerRef = useRef<HTMLDivElement>(null)

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-foreground">TITLEwise API Documentation</h1>
              <p className="text-sm text-muted-foreground mt-1">
                AI-powered document analysis for real estate closing attorneys
              </p>
            </div>
            <div className="flex items-center gap-4">
              <a
                href="/settings"
                className="text-sm text-primary hover:underline"
              >
                Get API Key →
              </a>
              <a
                href="/matters"
                className="px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors"
              >
                Dashboard
              </a>
            </div>
          </div>
        </div>
      </header>

      {/* Quick Links */}
      <div className="border-b border-border bg-muted/30">
        <div className="max-w-7xl mx-auto px-6 py-3">
          <div className="flex items-center gap-6 text-sm">
            <a href="#getting-started" className="text-muted-foreground hover:text-foreground transition-colors">
              Getting Started
            </a>
            <a href="#authentication" className="text-muted-foreground hover:text-foreground transition-colors">
              Authentication
            </a>
            <a href="#rate-limiting" className="text-muted-foreground hover:text-foreground transition-colors">
              Rate Limiting
            </a>
            <a href="#endpoints" className="text-muted-foreground hover:text-foreground transition-colors">
              Endpoints
            </a>
            <a href="#code-examples" className="text-muted-foreground hover:text-foreground transition-colors">
              Code Examples
            </a>
          </div>
        </div>
      </div>

      {/* Swagger UI */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div ref={swaggerRef} className="swagger-container">
          <SwaggerUI
            url="/api/openapi.yaml"
            deepLinking={true}
            displayRequestDuration={true}
            persistAuthorization={true}
            tryItOutEnabled={true}
            filter={true}
            docExpansion="list"
          />
        </div>
      </div>

      {/* Code Examples Section */}
      <div id="code-examples" className="max-w-7xl mx-auto px-6 py-8 border-t border-border">
        <h2 className="text-2xl font-semibold text-foreground mb-6">Code Examples</h2>

        {/* JavaScript Example */}
        <div className="mb-8">
          <h3 className="text-lg font-medium text-foreground mb-3">JavaScript / Node.js</h3>
          <pre className="bg-muted/40 border border-border rounded-lg p-4 overflow-x-auto">
            <code className="text-sm font-mono text-foreground">{`const response = await fetch('https://titlewise.app/api/v1/analyze-commitment', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer tw_live_YOUR_API_KEY',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    document_text: 'COMMITMENT FOR TITLE INSURANCE...',
    property_address: '123 Main Street'
  })
})

const data = await response.json()
console.log(data.analysis.summary)

// Check rate limit
console.log('Remaining:', response.headers.get('X-RateLimit-Remaining'))`}</code>
          </pre>
        </div>

        {/* Python Example */}
        <div className="mb-8">
          <h3 className="text-lg font-medium text-foreground mb-3">Python</h3>
          <pre className="bg-muted/40 border border-border rounded-lg p-4 overflow-x-auto">
            <code className="text-sm font-mono text-foreground">{`import requests

response = requests.post(
    'https://titlewise.app/api/v1/analyze-commitment',
    headers={
        'Authorization': 'Bearer tw_live_YOUR_API_KEY',
        'Content-Type': 'application/json'
    },
    json={
        'document_text': 'COMMITMENT FOR TITLE INSURANCE...',
        'property_address': '123 Main Street'
    }
)

data = response.json()
print(data['analysis']['summary'])

# Check rate limit
print(f"Remaining: {response.headers['X-RateLimit-Remaining']}")`}</code>
          </pre>
        </div>

        {/* cURL Example */}
        <div>
          <h3 className="text-lg font-medium text-foreground mb-3">cURL</h3>
          <pre className="bg-muted/40 border border-border rounded-lg p-4 overflow-x-auto">
            <code className="text-sm font-mono text-foreground">{`curl -X POST https://titlewise.app/api/v1/analyze-commitment \\
  -H "Authorization: Bearer tw_live_YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "document_text": "COMMITMENT FOR TITLE INSURANCE...",
    "property_address": "123 Main Street"
  }'`}</code>
          </pre>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-border bg-muted/30 mt-12">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between text-sm">
            <p className="text-muted-foreground">
              © 2026 TITLEwise. API v1.0.0
            </p>
            <div className="flex items-center gap-4">
              <a href="/terms" className="text-muted-foreground hover:text-foreground transition-colors">
                Terms
              </a>
              <a href="/privacy" className="text-muted-foreground hover:text-foreground transition-colors">
                Privacy
              </a>
              <a href="mailto:hello@titlewise.app" className="text-muted-foreground hover:text-foreground transition-colors">
                Support
              </a>
            </div>
          </div>
        </div>
      </footer>

      {/* Custom Swagger UI Styles */}
      <style jsx global>{`
        .swagger-container {
          background: transparent;
        }

        .swagger-ui .topbar {
          display: none;
        }

        .swagger-ui .info {
          margin: 0;
        }

        .swagger-ui .scheme-container {
          background: transparent;
          box-shadow: none;
          border: 1px solid hsl(var(--border));
          border-radius: 0.5rem;
        }
      `}</style>
    </div>
  )
}
