/** True when Postgres rejected an insert/update for a unique or primary-key conflict. */
export function isUniqueViolation(err: unknown): boolean {
  const seen = new Set<unknown>()
  let current: unknown = err
  while (current && typeof current === "object" && !seen.has(current)) {
    seen.add(current)
    // SQLSTATE only. Driver messages include the SQL and bound parameters, so
    // matching message text could misclassify other failures as duplicates.
    const record = current as { code?: string; cause?: unknown }
    if (record.code === "23505") return true
    current = record.cause
  }
  return false
}
