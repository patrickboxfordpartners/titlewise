import { redirect } from "next/navigation"
import { SignUp } from "@clerk/nextjs"
import { Logo } from "@/components/logo"
import { PLANS, type PlanKey } from "@/lib/plans"

const VALID_PLANS: PlanKey[] = ["solo", "small_firm", "pro", "enterprise"]

interface Props {
  searchParams: Promise<{ plan?: string }>
}

export default async function SignUpPage({ searchParams }: Props) {
  const { plan } = await searchParams
  if (!plan || !VALID_PLANS.includes(plan as PlanKey)) {
    redirect("/pricing")
  }
  const planKey = plan as PlanKey
  const planName = PLANS[planKey].name
  const isTrial = planKey === "solo"

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4">
      <div className="mb-8">
        <Logo href="/" />
      </div>

      {/* Plan badge */}
      <div className="mb-6 flex items-center gap-2 px-4 py-2 rounded-full border border-border bg-secondary/30 text-sm">
        <span className="font-semibold text-foreground">{planName} plan</span>
        {isTrial && (
          <span className="text-muted-foreground">— 7-day free trial</span>
        )}
      </div>

      <SignUp
        forceRedirectUrl={`/api/auth/post-signup?plan=${planKey}`}
      />
    </div>
  )
}
