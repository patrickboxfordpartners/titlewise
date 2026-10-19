import Stripe from "stripe"
export { PLANS, type PlanKey } from "./plans"

let client: Stripe | undefined

/** Lazily create and cache the Stripe client; throw if STRIPE_SECRET_KEY is missing. */
function getStripe(): Stripe {
  if (!client) {
    const key = process.env.STRIPE_SECRET_KEY
    if (!key) {
      throw new Error("Missing required environment variable: STRIPE_SECRET_KEY")
    }
    client = new Stripe(key, {
      apiVersion: "2026-03-25.dahlia",
    })
  }
  return client
}

export const stripe: Stripe = new Proxy({} as Stripe, {
  /** Forward property reads to the lazy client and bind methods to the real instance. */
  get(_target, prop) {
    const real = getStripe()
    const value = real[prop as keyof Stripe]
    return typeof value === "function" ? (value as (...args: unknown[]) => unknown).bind(real) : value
  },
})
