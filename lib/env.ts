function requireEnv(name: string): string {
  const value = process.env[name]
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`)
  }
  return value
}

// Lazy getters — only throw when actually accessed, not at import time
export const env = {
  get ANTHROPIC_API_KEY() { return requireEnv("ANTHROPIC_API_KEY") },
  get STRIPE_SECRET_KEY() { return requireEnv("STRIPE_SECRET_KEY") },
  get STRIPE_WEBHOOK_SECRET() { return requireEnv("STRIPE_WEBHOOK_SECRET") },
  get DATABASE_URL() { return requireEnv("DATABASE_URL") },
  get NEXT_PUBLIC_APP_URL() { return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000" },
}
