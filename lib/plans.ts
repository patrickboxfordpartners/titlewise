export const PLANS = {
  solo: {
    name: "Solo",
    price: 99,
    monthlyPriceId: process.env.STRIPE_SOLO_PRICE_ID ?? "",
    annualPriceId: process.env.STRIPE_SOLO_ANNUAL_PRICE_ID ?? "",
    seats: 1,
    description: "For solo practitioners",
  },
  small_firm: {
    name: "Small Firm",
    price: 249,
    monthlyPriceId: process.env.STRIPE_SMALL_FIRM_PRICE_ID ?? "",
    annualPriceId: process.env.STRIPE_SMALL_FIRM_ANNUAL_PRICE_ID ?? "",
    seats: 5,
    description: "Up to 5 attorneys",
  },
  team: {
    name: "Team",
    price: 499,
    monthlyPriceId: process.env.STRIPE_TEAM_PRICE_ID ?? "",
    annualPriceId: process.env.STRIPE_TEAM_ANNUAL_PRICE_ID ?? "",
    seats: 15,
    description: "Up to 15 attorneys",
  },
} as const

export type PlanKey = keyof typeof PLANS
