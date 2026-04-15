import { SignUp } from "@clerk/nextjs"
import Image from "next/image"

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
      <div className="mb-8">
        <Image src="/logo.svg" alt="TitleWise" width={200} height={40} priority />
      </div>
      <SignUp />
    </div>
  )
}
