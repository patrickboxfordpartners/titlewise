import { NextRequest, NextResponse } from "next/server"
import { z } from "zod/v4"
import { anthropic, SAFETY_PREAMBLE } from "@/lib/anthropic"
import { authenticateApiKey, verifyEnterpriseTier } from "@/lib/api-auth"
import { checkRateLimit, logApiUsage } from "@/lib/api-rate-limit"
import { triggerWebhooks } from "@/lib/webhook-dispatcher"

const requestSchema = z.object({
  document_text: z.string().min(100, "Document text must be at least 100 characters").max(500_000, "Document text is too long (max 500KB)"),
  property_address: z.string().optional(),
})

const SYSTEM_PROMPT = `You are an expert real estate closing attorney analyzing a Closing Disclosure (CD).
Your job is to review the CD for accuracy, compare to expected values, and flag any discrepancies or unusual terms.
Always respond with valid JSON matching the exact structure requested. Never include markdown code blocks in your response.

${SAFETY_PREAMBLE}`

const buildCDPrompt = (cdText: string) => `Analyze this Closing Disclosure and return a JSON object with the following structure:

{
  "loanInformation": {
    "loanAmount": "dollar amount or null",
    "interestRate": "percentage or null",
    "monthlyPayment": "dollar amount or null",
    "loanType": "conventional/FHA/VA/USDA or null",
    "term": "loan term (e.g., 30 years) or null"
  },
  "closingCosts": {
    "totalClosingCosts": "dollar amount or null",
    "lenderCredits": "dollar amount or null",
    "cashToClose": "dollar amount or null"
  },
  "loanCosts": [
    {
      "category": "category name (e.g., Origination Charges, Services Borrower Did Not Shop For)",
      "items": [
        {
          "description": "item description",
          "amount": "dollar amount",
          "flagged": true or false (flag if unusually high or unexpected)
        }
      ]
    }
  ],
  "otherCosts": [
    {
      "category": "category name (e.g., Taxes and Government Fees, Prepaids)",
      "items": [
        {
          "description": "item description",
          "amount": "dollar amount",
          "flagged": true or false
        }
      ]
    }
  ],
  "comparisonToLE": {
    "available": true or false,
    "discrepancies": [
      {
        "item": "which line item differs",
        "leAmount": "original Loan Estimate amount",
        "cdAmount": "final Closing Disclosure amount",
        "difference": "dollar difference",
        "explanation": "why this changed or if it's within tolerance"
      }
    ]
  },
  "redFlags": [
    {
      "severity": "high" or "medium",
      "issue": "short title of the issue",
      "explanation": "why this is flagged and what to verify"
    }
  ],
  "summary": "2-3 sentence executive summary of the CD review"
}

Closing Disclosure:
${cdText}`

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  const endpoint = "/api/v1/analyze-cd"
  const method = "POST"

  // 1. Authenticate API key
  const authResult = await authenticateApiKey(request)

  if (!authResult.success) {
    return NextResponse.json(
      { error: authResult.error },
      {
        status: authResult.status,
        headers: {
          "X-API-Version": "1.0.0",
          "X-RateLimit-Limit": "1000",
        }
      }
    )
  }

  const { userId, apiKeyId } = authResult

  // 2. Verify Enterprise tier
  const hasEnterprise = await verifyEnterpriseTier(userId)
  if (!hasEnterprise) {
    return NextResponse.json(
      { error: "Enterprise plan required for API access" },
      { status: 403 }
    )
  }

  // 3. Check rate limit
  const rateLimitResult = await checkRateLimit(apiKeyId)

  if (!rateLimitResult.allowed) {
    await logApiUsage({
      apiKeyId,
      userId,
      endpoint,
      method,
      statusCode: 429,
      durationMs: Date.now() - startTime,
      ipAddress: request.headers.get("x-forwarded-for") || undefined,
      userAgent: request.headers.get("user-agent") || undefined
    })

    return NextResponse.json(
      {
        error: "Rate limit exceeded",
        limit: rateLimitResult.limit,
        resetAt: rateLimitResult.resetAt
      },
      {
        status: 429,
        headers: {
          "X-RateLimit-Limit": String(rateLimitResult.limit),
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": String(rateLimitResult.resetAt)
        }
      }
    )
  }

  // 4. Parse and validate request body
  let body
  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON in request body" },
      { status: 400 }
    )
  }

  const validation = requestSchema.safeParse(body)
  if (!validation.success) {
    return NextResponse.json(
      {
        error: "Invalid request body",
        details: validation.error.issues
      },
      { status: 400 }
    )
  }

  const { document_text, property_address } = validation.data

  // 5. Call Claude API for analysis
  let analysis
  let tokensUsed = 0

  try {
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 4096,
      temperature: 0,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: buildCDPrompt(document_text)
        }
      ]
    })

    const content = response.content[0]
    if (content.type !== "text") {
      throw new Error("Unexpected response type from Claude API")
    }

    tokensUsed = response.usage.input_tokens + response.usage.output_tokens

    // Parse Claude's JSON response
    const jsonMatch = content.text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error("No valid JSON found in Claude response")
    }

    analysis = JSON.parse(jsonMatch[0])

  } catch (error: any) {
    console.error("[API v1] Claude API error:", error)


    // Trigger failure webhook
    triggerWebhooks(userId, "analysis.failed", {
      endpoint,
      userId,
      status: "failed",
      error: error.message || "Unknown error"
    }).catch((err) => {
      console.error("[Webhooks] Failed to trigger:", err)
    })

    await logApiUsage({
      apiKeyId,
      userId,
      endpoint,
      method,
      statusCode: 500,
      durationMs: Date.now() - startTime,
      ipAddress: request.headers.get("x-forwarded-for") || undefined,
      userAgent: request.headers.get("user-agent") || undefined
    })

    return NextResponse.json(
      {
        error: "Analysis failed",
        message: error.message || "Unknown error"
      },
      { status: 500 }
    )
  }

  // 6. Log successful request
  const durationMs = Date.now() - startTime
  await logApiUsage({
    apiKeyId,
    userId,
    endpoint,
    method,
    statusCode: 200,
    durationMs,
    tokensUsed,
    requestSizeBytes: JSON.stringify(body).length,
    responseSizeBytes: JSON.stringify(analysis).length,
    ipAddress: request.headers.get("x-forwarded-for") || undefined,
    userAgent: request.headers.get("user-agent") || undefined
  })

  // 7. Return response with rate limit headers
  return NextResponse.json(
    {
      analysis,
      usage: {
        tokens: tokensUsed
      }
    },
    {
      status: 200,
      headers: {
        "X-API-Version": "1.0.0",
        "X-RateLimit-Limit": "1000",
        "X-RateLimit-Remaining": String(rateLimitResult.remaining - 1),
        "X-RateLimit-Reset": String(rateLimitResult.resetAt),
        "X-Response-Time-Ms": String(durationMs)
      }
    }
  )
}

// Handle OPTIONS for CORS preflight
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Authorization, Content-Type",
      "Access-Control-Max-Age": "86400"
    }
  })
}
