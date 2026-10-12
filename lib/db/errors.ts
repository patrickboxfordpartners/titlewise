/** True when Postgres rejected an insert/update for a unique or primary-key conflict. */
export function isUniqueViolation(err: unknown): boolean {
  const seen = new Set<unknown>()
  let current: unknown = err
  while (current && typeof current === "object" && !seen.has(current)) {
    seen.add(current)
    const record = current as { code?: string; message?: string; cause?: unknown }
    if (record.code === "23505") return true
    if (typeof record.message === "string" && /duplicate key|unique constraint/i.test(record.message)) {
      return true
    }
    current = record.cause
  }
  return false
}
