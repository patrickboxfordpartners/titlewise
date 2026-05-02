import crypto from "crypto"
import { db } from "@/lib/db"
import { webhooks } from "@/lib/db/schema"
import { eq, and } from "drizzle-orm"

type WebhookEvent = "analysis.completed" | "analysis.failed"

type WebhookPayload = {
  event: WebhookEvent
  timestamp: number
  data: {
    analysisId?: string
    endpoint: string
    userId: string
    status: "completed" | "failed"
    result?: any
    error?: string
  }
}

/**
 * Generate HMAC-SHA256 signature for webhook payload
 */
function generateSignature(payload: string, secret: string): string {
  const hmac = crypto.createHmac("sha256", secret)
  hmac.update(payload)
  return hmac.digest("hex")
}

/**
 * Dispatch webhook with retry logic
 */
async function dispatchWebhook(
  url: string,
  payload: WebhookPayload,
  secret: string,
  retryCount = 0
): Promise<{ success: boolean; error?: string }> {
  const maxRetries = 3
  const payloadString = JSON.stringify(payload)
  const signature = generateSignature(payloadString, secret)

  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 10000) // 10s timeout

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Webhook-Signature": signature,
        "X-Webhook-Event": payload.event,
        "User-Agent": "TitleWise-Webhooks/1.0",
      },
      body: payloadString,
      signal: controller.signal,
    })

    clearTimeout(timeout)

    if (response.ok) {
      return { success: true }
    }

    // Retry on 5xx errors
    if (response.status >= 500 && retryCount < maxRetries) {
      await new Promise((resolve) => setTimeout(resolve, 1000 * (retryCount + 1))) // Exponential backoff
      return dispatchWebhook(url, payload, secret, retryCount + 1)
    }

    return {
      success: false,
      error: `HTTP ${response.status}: ${response.statusText}`,
    }
  } catch (error) {
    // Retry on network errors
    if (retryCount < maxRetries) {
      await new Promise((resolve) => setTimeout(resolve, 1000 * (retryCount + 1)))
      return dispatchWebhook(url, payload, secret, retryCount + 1)
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : "Network error",
    }
  }
}

/**
 * Trigger webhooks for a specific event
 */
export async function triggerWebhooks(
  userId: string,
  event: WebhookEvent,
  data: WebhookPayload["data"]
) {
  // Fetch active webhooks subscribed to this event
  const userWebhooks = await db
    .select()
    .from(webhooks)
    .where(and(eq(webhooks.userId, userId), eq(webhooks.isActive, "true")))

  const subscribedWebhooks = userWebhooks.filter((webhook) => {
    const events = webhook.events as string[]
    return events.includes(event)
  })

  if (subscribedWebhooks.length === 0) {
    return // No webhooks to trigger
  }

  const payload: WebhookPayload = {
    event,
    timestamp: Date.now(),
    data,
  }

  // Dispatch webhooks in parallel
  const results = await Promise.all(
    subscribedWebhooks.map(async (webhook) => {
      const result = await dispatchWebhook(webhook.url, payload, webhook.secret)

      // Update webhook status
      if (result.success) {
        // Reset failure count on success
        await db
          .update(webhooks)
          .set({
            lastTriggeredAt: new Date(),
            failureCount: 0,
          })
          .where(eq(webhooks.id, webhook.id))
      } else {
        // Increment failure count
        const newFailureCount = webhook.failureCount + 1

        // Auto-disable after 10 consecutive failures
        if (newFailureCount >= 10) {
          await db
            .update(webhooks)
            .set({
              failureCount: newFailureCount,
              isActive: "false",
            })
            .where(eq(webhooks.id, webhook.id))
        } else {
          await db
            .update(webhooks)
            .set({
              failureCount: newFailureCount,
              lastTriggeredAt: new Date(),
            })
            .where(eq(webhooks.id, webhook.id))
        }
      }

      return { webhookId: webhook.id, ...result }
    })
  )

  // Log results for debugging (could be stored in a webhook_logs table)
  console.log(`[Webhooks] Triggered ${subscribedWebhooks.length} webhooks for event ${event}:`, results)
}

/**
 * Verify webhook signature (for webhook receivers)
 */
export function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const expectedSignature = generateSignature(payload, secret)
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  )
}
