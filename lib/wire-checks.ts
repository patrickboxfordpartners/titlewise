import { createHmac, timingSafeEqual } from "crypto"

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

function hashKey(): string | null {
  return process.env.WIRE_HASH_SECRET || process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || null
}

/** Keyed hash of a full account number, scoped to a user. Returns null if no key is configured. */
export function hashAccount(userId: string, account: string | null | undefined): string | null {
  const key = hashKey()
  const normalized = normalizeAccount(account)
  if (!key || !normalized) return null
  return createHmac("sha256", key).update(`acct:${userId}:${normalized}`).digest("hex").slice(0, 32)
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
