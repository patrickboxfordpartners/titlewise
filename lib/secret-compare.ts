import { createHash, timingSafeEqual } from "crypto"

/**
 * Constant-time string compare. Returns false when either value is missing.
 * Both sides are hashed first so the compare is fixed-length and does not leak
 * the expected secret's length.
 */
export function secretsMatch(provided: string | null | undefined, expected: string | null | undefined): boolean {
  if (!provided || !expected) return false
  const left = createHash("sha256").update(provided).digest()
  const right = createHash("sha256").update(expected).digest()
  return timingSafeEqual(left, right)
}
