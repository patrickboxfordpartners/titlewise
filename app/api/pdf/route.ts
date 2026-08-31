import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-helpers'
import { chromium } from 'playwright-core'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

export async function POST(request: NextRequest) {
  try {
    const userId = await requireAuth()

  const wsEndpoint = process.env.BROWSER_WS_ENDPOINT
  if (!wsEndpoint) {
    return NextResponse.json({ error: 'BROWSER_WS_ENDPOINT not configured' }, { status: 503 })
  }

  const { html, filename = 'titlewise-export.pdf' } = await request.json() as { html: string; filename?: string }
  if (!html) return NextResponse.json({ error: 'html required' }, { status: 400 })

  const browser = await chromium.connectOverCDP(wsEndpoint)
  try {
    const context = await browser.newContext()
    const page = await context.newPage()
    await page.setContent(html, { waitUntil: 'networkidle' })
    const pdfBytes = await page.pdf({
      format: 'Letter',
      margin: { top: '0.6in', right: '0.6in', bottom: '0.6in', left: '0.6in' },
      printBackground: true,
    })
    await context.close()

    return new NextResponse(new Uint8Array(pdfBytes), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } finally {
    await browser.close()
  }
  } catch (error) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}
