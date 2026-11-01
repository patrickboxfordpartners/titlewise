import { createHash, createHmac, timingSafeEqual } from "crypto"
import { logger } from "@/lib/logger"

/**
 * Deterministic wire-instruction checks that run alongside the AI screening.
 * Nothing here contacts an outside data source.
 */

/** ABA routing number checksum (3-7-1 weighting). */
export function isValidAbaRouting(routing: string | null | undefined): boolean {
  if (!routing) return false
  const digits = routing.replace(/[\s-]/g, "")
  if (!/^\d{9}$/.test(digits)) return false
  const d = digits.split("").map(Number)
  const sum = 3 * (d[0] + d[3] + d[6]) + 7 * (d[1] + d[4] + d[7]) + (d[2] + d[5] + d[8])
  return sum % 10 === 0 && sum !== 0
}

export function normalizeRouting(routing: string | null | undefined): string | null {
  if (!routing) return null
  const digits = routing.replace(/[\s-]/g, "")
  return digits || null
}

export function normalizeAccount(account: string | null | undefined): string | null {
  if (!account) return null
  const cleaned = account.replace(/[\s-]/g, "").toUpperCase()
  // A masked value (e.g. ****1234) can't be compared reliably.
  if (!cleaned || /[*•]|XXX/.test(cleaned)) return null
  return cleaned
}

let warnedMissingKey = false

function hashKey(): string | null {
  const key = process.env.WIRE_HASH_SECRET || process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || null
  if (!key && !warnedMissingKey) {
    warnedMissingKey = true
    logger.error("wire-checks", "No WIRE_HASH_SECRET, AUTH_SECRET or NEXTAUTH_SECRET is set, so account comparison and confirm tokens are disabled")
  }
  return key
}

/** Short fingerprint of the active hash key, stored with each hash so a key change is detectable. */
export function hashKeyFingerprint(): string | null {
  const key = hashKey()
  if (!key) return null
  return createHash("sha256").update(`wire-key:${key}`).digest("hex").slice(0, 8)
}

/**
 * Keyed hash of a full account number, scoped to a user, formatted "v1:<keyFingerprint>:<hmac>".
 * Returns null if no key is configured or the number is missing/masked.
 */
export function hashAccount(userId: string, account: string | null | undefined): string | null {
  const key = hashKey()
  const fp = hashKeyFingerprint()
  const normalized = normalizeAccount(account)
  if (!key || !fp || !normalized) return null
  const mac = createHmac("sha256", key).update(`acct:${userId}:${normalized}`).digest("hex").slice(0, 32)
  return `v1:${fp}:${mac}`
}

/** True when a stored hash was made with the currently active key (so it can be compared). */
export function hashUsesActiveKey(stored: string): boolean {
  const fp = hashKeyFingerprint()
  return Boolean(fp) && stored.startsWith(`v1:${fp}:`)
}

/** True when a model-extracted routing number appears, digits only, in the text the user pasted. */
export function routingAppearsInSource(source: string, routing: string | null): boolean {
  if (!routing) return false
  return source.replace(/\D/g, "").includes(routing.replace(/\D/g, ""))
}

/** True when a model-extracted account number appears in the pasted text (ignoring spaces, dashes and case). */
export function accountAppearsInSource(source: string, account: string | null | undefined): boolean {
  const normalized = normalizeAccount(account)
  if (!normalized) return false
  return source.replace(/[\s-]/g, "").toUpperCase().includes(normalized)
}

export function maskAccount(account: string | null | undefined): string | null {
  const normalized = account ? account.replace(/[\s-]/g, "") : ""
  if (!normalized) return null
  return `****${normalized.slice(-4)}`
}

/**
 * The wire_instructions.account_number column stores "****1234" or, when a key
 * is configured, "****1234|h:<hash>" so changed accounts can be detected without
 * storing the full number and without a schema change.
 */
export function encodeStoredAccount(masked: string | null, hash: string | null): string | null {
  if (!masked) return null
  return hash ? `${masked}|h:${hash}` : masked
}

export function decodeStoredAccount(stored: string | null | undefined): { masked: string | null; hash: string | null } {
  if (!stored) return { masked: null, hash: null }
  const [masked, rest] = stored.split("|h:")
  return { masked: masked || null, hash: rest || null }
}

export type WireConfirmPayload = {
  u: string
  bank: string | null
  routing: string | null
  acct: string | null
  ben: string | null
  matter: string | null
  exp: number
}

/** Signed token so the confirm route can save exactly what was analyzed (incl. the account hash) without the client ever seeing the full number. */
export function signConfirmToken(payload: WireConfirmPayload): string | null {
  const key = hashKey()
  if (!key) return null
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url")
  const sig = createHmac("sha256", key).update(`wire-confirm:${body}`).digest("base64url")
  return `${body}.${sig}`
}

export function verifyConfirmToken(token: string): WireConfirmPayload | null {
  const key = hashKey()
  if (!key) return null
  const [body, sig] = token.split(".")
  if (!body || !sig) return null
  const expected = createHmac("sha256", key).update(`wire-confirm:${body}`).digest("base64url")
  const a = Buffer.from(sig)
  const b = Buffer.from(expected)
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null
  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString()) as WireConfirmPayload
    if (typeof payload.exp !== "number" || payload.exp < Date.now()) return null
    return payload
  } catch {
    return null
  }
}
