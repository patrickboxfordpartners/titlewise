import { SignIn } from "@clerk/nextjs"
import { Logo } from "@/components/logo"

export default function SignInPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background">
      <div className="mb-8">
        <Logo href="/" />
      </div>
      <SignIn />
    </div>
  )
}
