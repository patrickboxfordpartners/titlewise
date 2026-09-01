"use client"

import { motion } from "framer-motion"
import { Loader2, ExternalLink, Check, ArrowRight, Sparkles } from "lucide-react"
import { PLANS } from "@/lib/plans"

type SubscriptionPanelProps = {
  subscriptionStatus: string | null
  subscriptionTier: string | null
  monthlyUsageCount: number | null
  usageResetAt: string | null
  hasStripeCustomer: boolean
  onManageBilling: () => void
  portalLoading: boolean
}

export function SubscriptionPanel({
  subscriptionStatus,
  subscriptionTier,
  monthlyUsageCount,
  usageResetAt,
  hasStripeCustomer,
  onManageBilling,
  portalLoading,
}: SubscriptionPanelProps) {
  const currentPlan = subscriptionTier ? PLANS[subscriptionTier as keyof typeof PLANS] : null
  const isActive = subscriptionStatus === "active"

  const upgradeOptions = currentPlan
    ? Object.entries(PLANS)
        .filter(([key, plan]) => plan.price > currentPlan.price)
        .map(([key, plan]) => ({
          key,
          ...plan,
          savings: Math.round(((plan.monthlyGenerationLimit - currentPlan.monthlyGenerationLimit) / currentPlan.monthlyGenerationLimit) * 100),
        }))
    : []

  const statusColors: Record<string, string> = {
    active: "text-green-600",
    past_due: "text-red-600",
    canceled: "text-muted-foreground",
  }

  const statusLabels: Record<string, string> = {
    active: "Active",
    past_due: "Past Due",
    canceled: "Canceled",
    inactive: "Inactive",
  }

  const usagePercentage = currentPlan && monthlyUsageCount
    ? Math.min(100, (monthlyUsageCount / currentPlan.monthlyGenerationLimit) * 100)
    : 0

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.26, duration: 0.4 }}
      className="bg-card rounded-xl border border-border p-6"
    >
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-sm font-semibold text-foreground">Subscription & Usage</h2>
        <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusColors[subscriptionStatus ?? "inactive"]} bg-current/10`}>
          {statusLabels[subscriptionStatus ?? "inactive"]}
        </span>
      </div>

      {/* Current Plan */}
      {currentPlan ? (
        <div className="mb-6 p-4 bg-muted/30 rounded-lg border border-border">
          <div className="flex items-start justify-between mb-3">
            <div>
              <h3 className="text-lg font-semibold text-foreground">{currentPlan.name}</h3>
              <p className="text-sm text-muted-foreground mt-0.5">{currentPlan.description}</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-foreground">${currentPlan.price}</p>
              <p className="text-xs text-muted-foreground">per month</p>
            </div>
          </div>

          {/* Usage Bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">AI Generations</span>
              <span className="font-medium text-foreground">
                {monthlyUsageCount ?? 0} / {currentPlan.monthlyGenerationLimit}
              </span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-300"
                style={{ width: `${usagePercentage}%` }}
              />
            </div>
            {usageResetAt && (
              <p className="text-xs text-muted-foreground">
                Resets on {new Date(new Date(usageResetAt).getTime() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
              </p>
            )}
          </div>

          {/* Current Plan Features */}
          <div className="mt-4 pt-4 border-t border-border">
            <p className="text-xs font-medium text-muted-foreground mb-2">Your plan includes:</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div className="flex items-center gap-1.5 text-xs text-foreground">
                <Check className="h-3.5 w-3.5 text-green-600" />
                <span>{currentPlan.seats} {currentPlan.seats === 1 ? "seat" : "seats"}</span>
              </div>
              {currentPlan.hasClientPortal && (
                <div className="flex items-center gap-1.5 text-xs text-foreground">
                  <Check className="h-3.5 w-3.5 text-green-600" />
                  <span>Client portal</span>
                </div>
              )}
              {currentPlan.hasWireFraudMemory && (
                <div className="flex items-center gap-1.5 text-xs text-foreground">
                  <Check className="h-3.5 w-3.5 text-green-600" />
                  <span>Wire fraud protection</span>
                </div>
              )}
              {currentPlan.hasTridEngine && (
                <div className="flex items-center gap-1.5 text-xs text-foreground">
                  <Check className="h-3.5 w-3.5 text-green-600" />
                  <span>TRID engine</span>
                </div>
              )}
              {currentPlan.hasAgent && (
                <div className="flex items-center gap-1.5 text-xs text-foreground">
                  <Check className="h-3.5 w-3.5 text-green-600" />
                  <span>AI closing agent</span>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="mb-6 p-6 bg-muted/20 rounded-lg border border-dashed border-border text-center">
          <p className="text-sm text-muted-foreground mb-3">No active subscription</p>
          <a
            href="/pricing"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary hover:bg-primary/90 text-white text-sm font-medium rounded-lg transition-colors"
          >
            View Plans <ArrowRight className="h-3.5 w-3.5" />
          </a>
        </div>
      )}

      {/* Upgrade Options */}
      {isActive && upgradeOptions.length > 0 && (
        <div className="space-y-3 mb-6">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-semibold text-foreground">Upgrade for more power</h3>
          </div>

          {upgradeOptions.map(({ key, name, price, seats, monthlyGenerationLimit, savings }) => (
            <div
              key={key}
              className="p-4 bg-gradient-to-br from-primary/5 to-primary/10 rounded-lg border border-primary/20 hover:border-primary/40 transition-colors"
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h4 className="text-sm font-semibold text-foreground">{name}</h4>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {seats} seats • {monthlyGenerationLimit.toLocaleString()} generations/mo
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-foreground">${price}</p>
                  <p className="text-xs text-muted-foreground">/month</p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-primary/20">
                <p className="text-xs font-medium text-primary">
                  +{savings}% more generations
                </p>
                <button
                  onClick={onManageBilling}
                  className="text-xs font-medium px-3 py-1.5 bg-primary hover:bg-primary/90 text-white rounded-md transition-colors"
                >
                  Upgrade
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Manage Billing Button */}
      <div className="flex gap-3">
        {hasStripeCustomer ? (
          <button
            onClick={onManageBilling}
            disabled={portalLoading}
            className="flex items-center justify-center gap-1.5 px-4 py-2.5 border border-border hover:bg-muted/40 text-sm font-medium text-foreground rounded-lg transition-colors w-full"
          >
            {portalLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading...
              </>
            ) : (
              <>
                <ExternalLink className="h-4 w-4" />
                Manage Billing & Payment
              </>
            )}
          </button>
        ) : (
          <a
            href="/pricing"
            className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-primary hover:bg-primary/90 text-white text-sm font-medium rounded-lg transition-colors w-full"
          >
            Subscribe Now
          </a>
        )}
      </div>
    </motion.section>
  )
}
