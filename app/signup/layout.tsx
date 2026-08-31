export default function SignupLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <style jsx global>{`
        html, body {
          background: #ffffff !important;
          background-color: #ffffff !important;
        }
      `}</style>
      {children}
    </>
  )
}
