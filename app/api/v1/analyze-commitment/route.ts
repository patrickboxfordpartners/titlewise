import { NextRequest, NextResponse } from "next/server"
import { z } from "zod/v4"
import { anthropic, SAFETY_PREAMBLE } from "@/lib/anthropic"
import { db } from "@/lib/db"
import { titleAnalyses } from "@/lib/db/schema"
import { authenticateApiKey, verifyEnterpriseTier } from "@/lib/api-auth"
import { checkRateLimit, logApiUsage } from "@/lib/api-rate-limit"
import { triggerWebhooks } from "@/lib/webhook-dispatcher"

const requestSchema = z.object({
  document_text: z.string().min(100, "Document text must be at least 100 characters").max(500_000, "Document text is too long (max 500KB)"),
  property_address: z.string().optional(),
})

const SYSTEM_PROMPT = `You are an expert real estate closing attorney analyzing a title commitment.
Your job is to extract and explain key information in plain English that a client or junior attorney can understand.
Always respond with valid JSON matching the exact structure requested. Never include markdown code blocks in your response.

${SAFETY_PREAMBLE}`

const buildTitlePrompt = (commitment: string) => `Analyze this title commitment and return a JSON object with the following structure:

{
  "property": {
    "address": "full property address or null if not found",
    "type": "property type (residential/commercial/land/etc) or null",
    "owners": "current owner(s) or null",
    "amount": "policy amount or null"
  },
  "scheduleA": {
    "summary": "2-3 sentence plain-English summary of Schedule A details"
  },
  "requirements": [
    {
      "item": "requirement number or label",
      "description": "plain-English explanation of what must happen before closing",
      "flagged": true or false (flag if unusual, complex, or needs attorney attention)
    }
  ],
  "exceptions": [
    {
      "item": "exception number or label",
      "description": "plain-English explanation of what is NOT covered by the policy",
      "flagged": true or false (flag if unusual, potentially problematic, or needs attorney attention)
    }
  ],
  "redFlags": [
    {
      "severity": "high" or "medium",
      "issue": "short title of the issue",
      "explanation": "why this is flagged and what to do about it"
    }
  ],
  "summary": "2-3 sentence executive summary of the commitment's overall status"
}

Title Commitment:
${commitment}`

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  const endpoint = "/api/v1/analyze-commitment"
  const method = "POST"

  // 1. Authenticate API key
  const authResult = await authenticateApiKey(request)

  if (!authResult.success) {
    // Log failed auth attempt
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
    // Log rate limit exceeded
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
      model: "claude-sonnet-4-20250514",
      max_tokens: 4096,
      temperature: 0,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: buildTitlePrompt(document_text)
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

    // Log failed request
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

    // Trigger failure webhook
    triggerWebhooks(userId, "analysis.failed", {
      endpoint,
      userId,
      status: "failed",
      error: error.message || "Unknown error"
    }).catch((err) => {
      console.error("[Webhooks] Failed to trigger:", err)
    })

    return NextResponse.json(
      {
        error: "Analysis failed",
        message: error.message || "Unknown error"
      },
      { status: 500 }
    )
  }

  // 6. Store analysis result
  const [dbAnalysis] = await db
    .insert(titleAnalyses)
    .values({
      userId,
      propertyAddress: property_address || analysis.property?.address || null,
      commitmentText: document_text.substring(0, 10000), // Store first 10k chars
      analysis
    })
    .returning()

  // 7. Log successful request
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

  // 8. Trigger webhooks (async, don't wait)
  triggerWebhooks(userId, "analysis.completed", {
    analysisId: dbAnalysis.id,
    endpoint,
    userId,
    status: "completed",
    result: analysis
  }).catch((err) => {
    console.error("[Webhooks] Failed to trigger:", err)
  })

  // 9. Return response with rate limit headers
  return NextResponse.json(
    {
      id: dbAnalysis.id,
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
