import { SignIn } from "@clerk/nextjs"
import { Logo } from "@/components/logo"

export default function SignInPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white relative overflow-hidden">
      {/* Blue gradient backdrop */}
      <div
        className="absolute top-0 left-0 right-0 z-0"
        style={{
          height: "40vh",
          background: "linear-gradient(90deg, #e3f2fd 0%, #90caf9 25%, #42a5f5 50%, #1e88e5 75%, #1565c0 100%)",
          filter: "blur(60px)",
          opacity: 0.3,
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/80 to-white z-0" />

      <div className="relative z-10">
        <div className="mb-8 flex justify-center">
          <Logo href="/" />
        </div>
        <SignIn
          appearance={{
            elements: {
              formButtonPrimary:
                'bg-[#0066cc] hover:bg-[#0052a3] text-white font-normal rounded-full',
              card: 'shadow-lg',
              headerTitle: 'font-light text-[#0d253d]',
              headerSubtitle: 'font-light text-[#64748d]',
              socialButtonsBlockButton:
                'font-normal border-[#e3e8ee] hover:bg-[#f8fafc]',
              formFieldLabel: 'font-light text-[#64748d]',
              formFieldInput:
                'font-light border-[#e3e8ee] focus:border-[#0066cc]',
              footerActionLink: 'text-[#0066cc] hover:text-[#0052a3] font-normal',
            }
          }}
        />
      </div>
    </div>
  )
}
