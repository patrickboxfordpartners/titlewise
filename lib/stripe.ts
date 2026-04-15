import Stripe from "stripe"
import { env } from "./env"
export { PLANS, type PlanKey } from "./plans"

export const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
  apiVersion: "2026-03-25.dahlia",
})
