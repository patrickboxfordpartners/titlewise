import { db } from "@/lib/db"
import { apiKeys, users } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import bcrypt from "bcryptjs"

export type AuthResult =
  | { success: true; userId: string; apiKeyId: string }
  | { success: false; error: string; status: number }

/**
 * Authenticates API requests using Bearer token
 *
 * @param request - Next.js Request object
 * @returns AuthResult with user/key IDs or error
 */
export async function authenticateApiKey(request: Request): Promise<AuthResult> {
  // 1. Extract Authorization header
  const authHeader = request.headers.get("Authorization")

  if (!authHeader) {
    return {
      success: false,
      error: "Missing Authorization header. Include: Authorization: Bearer tw_live_...",
      status: 401
    }
  }

  if (!authHeader.startsWith("Bearer ")) {
    return {
      success: false,
      error: "Invalid Authorization format. Use: Authorization: Bearer tw_live_...",
      status: 401
    }
  }

  const apiKey = authHeader.replace("Bearer ", "").trim()

  // 2. Validate key format
  if (!apiKey.startsWith("tw_live_")) {
    return {
      success: false,
      error: "Invalid API key format. Keys should start with tw_live_",
      status: 401
    }
  }

  // 3. Extract prefix (first 16 chars)
  const keyPrefix = apiKey.substring(0, 16)

  // 4. Look up key by prefix (fast index lookup)
  const keys = await db
    .select({
      id: apiKeys.id,
      userId: apiKeys.userId,
      keyHash: apiKeys.keyHash,
      isActive: apiKeys.isActive
    })
    .from(apiKeys)
    .where(eq(apiKeys.keyPrefix, keyPrefix))

  if (keys.length === 0) {
    return {
      success: false,
      error: "Invalid API key",
      status: 401
    }
  }

  // 5. Verify key hash (bcrypt compare)
  let validKey = null
  for (const key of keys) {
    if (key.isActive === "true" && await bcrypt.compare(apiKey, key.keyHash)) {
      validKey = key
      break
    }
  }

  if (!validKey) {
    return {
      success: false,
      error: "Invalid or revoked API key",
      status: 401
    }
  }

  // 6. Update last_used_at (fire and forget)
  db.update(apiKeys)
    .set({ lastUsedAt: new Date() })
    .where(eq(apiKeys.id, validKey.id))
    .execute()
    .catch(() => {}) // Don't fail request if update fails

  // 7. Return success with IDs
  return {
    success: true,
    userId: validKey.userId,
    apiKeyId: validKey.id
  }
}

/**
 * Verify user has Enterprise subscription
 */
export async function verifyEnterpriseTier(userId: string): Promise<boolean> {
  const [user] = await db
    .select({ subscriptionTier: users.subscriptionTier })
    .from(users)
    .where(eq(users.id, userId))

  return user?.subscriptionTier === "enterprise"
}
