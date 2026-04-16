import { SignUp } from "@clerk/nextjs"
import { Logo } from "@/components/logo"

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background">
      <div className="mb-8">
        <Logo href="/" />
      </div>
      <SignUp />
    </div>
  )
}
