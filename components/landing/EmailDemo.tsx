"use client"

import { useEffect, useState, useRef } from "react"

const FORM = {
  client: "Sarah and David Thompson",
  address: "18 Harbor View Drive, Portsmouth, NH",
  stage: "Title Search Ordered",
  completed: "Signed purchase/sale agreement\nTitle search ordered",
}

const EMAIL = `Subject: Status Update — 18 Harbor View Drive | Thompson Purchase

Dear Sarah and David,

I wanted to reach out with a brief update on the progress of your purchase at 18 Harbor View Drive.

We have received your signed purchase and sale agreement and have ordered the title search on the property. These are important early steps and we are moving forward on our end.

A few items still outstanding before we can schedule your closing:

— Title commitment received and reviewed
— Title exceptions cleared
— Wire instructions verified
— Closing documents prepared

I will be in touch as each milestone is completed. Please don't hesitate to reach out with any questions.

Best regards,
Patrick Mitchell
TITLEwise Closing Group`

const FIELD_SEQUENCE = [
  { key: "client", label: "Client Name", delay: 400 },
  { key: "address", label: "Property Address", delay: 1200 },
  { key: "stage", label: "Current Stage", delay: 2000 },
  { key: "completed", label: "Completed Items", delay: 2800 },
]

const CHAR_DELAY = 28 // ms per character
const EMAIL_START_DELAY = 3800 // when email starts streaming

export default function EmailDemo() {
  const [fields, setFields] = useState<Record<string, string>>({
    client: "", address: "", stage: "", completed: "",
  })
  const [emailText, setEmailText] = useState("")
  const [activeField, setActiveField] = useState<string | null>(null)
  const [emailStarted, setEmailStarted] = useState(false)
  const timeouts = useRef<ReturnType<typeof setTimeout>[]>([])

  function clearAll() {
    timeouts.current.forEach(clearTimeout)
    timeouts.current = []
  }

  function run() {
    clearAll()
    setFields({ client: "", address: "", stage: "", completed: "" })
    setEmailText("")
    setEmailStarted(false)
    setActiveField(null)

    // Type each form field
    FIELD_SEQUENCE.forEach(({ key, delay }) => {
      const value = FORM[key as keyof typeof FORM]
      const t0 = setTimeout(() => {
        setActiveField(key)
        let i = 0
        function typeChar() {
          if (i <= value.length) {
            const captured = i
            setFields(prev => ({ ...prev, [key]: value.slice(0, captured) }))
            i++
            if (i <= value.length) {
              const t = setTimeout(typeChar, CHAR_DELAY)
              timeouts.current.push(t)
            } else {
              setActiveField(null)
            }
          }
        }
        typeChar()
      }, delay)
      timeouts.current.push(t0)
    })

    // Stream email text
    const emailT = setTimeout(() => {
      setEmailStarted(true)
      let i = 0
      function typeEmail() {
        if (i <= EMAIL.length) {
          const captured = i
          setEmailText(EMAIL.slice(0, captured))
          i++
          if (i <= EMAIL.length) {
            const t = setTimeout(typeEmail, 12)
            timeouts.current.push(t)
          }
        }
      }
      typeEmail()
    }, EMAIL_START_DELAY)
    timeouts.current.push(emailT)

    // Loop
    const loopDelay = EMAIL_START_DELAY + EMAIL.length * 12 + 3000
    const loopT = setTimeout(run, loopDelay)
    timeouts.current.push(loopT)
  }

  useEffect(() => {
    if (window.innerWidth < 640) {
      setFields({ matter: "18 Harbor View Drive", address: "18 Harbor View Dr, Portland ME 04101", stage: "Clear to Close", completed: "Title, Wire, CD" })
      setEmailText(EMAIL)
      setEmailStarted(true)
      return
    }
    run()
    return clearAll
  }, [])

  const BG = "#0f1219"
  const PANEL = "#141820"
  const BORDER = "rgba(237,238,240,0.08)"
  const TEXT = "#EDEEF0"
  const MUTED = "rgba(237,238,240,0.45)"
  const DIM = "rgba(237,238,240,0.2)"
  const BLUE = "#3b82f6"
  const LABEL = "rgba(237,238,240,0.35)"

  function Field({ fieldKey, label, multiline }: { fieldKey: string; label: string; multiline?: boolean }) {
    const isActive = activeField === fieldKey
    const value = fields[fieldKey]
    return (
      <div style={{ marginBottom: 14 }}>
        <p style={{ fontSize: "0.7rem", color: LABEL, marginBottom: 4, fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase" }}>{label}</p>
        <div style={{
          background: "rgba(255,255,255,0.04)",
          border: `1px solid ${isActive ? "rgba(59,130,246,0.5)" : BORDER}`,
          borderRadius: 6, padding: multiline ? "8px 10px" : "7px 10px",
          minHeight: multiline ? 56 : "auto",
          transition: "border-color 0.2s",
          boxShadow: isActive ? "0 0 0 2px rgba(59,130,246,0.12)" : "none",
        }}>
          <span style={{ fontSize: "0.8125rem", color: TEXT, whiteSpace: "pre-wrap", lineHeight: 1.5 }}>
            {value}
            {isActive && <span style={{ display: "inline-block", width: 1.5, height: "0.9em", background: BLUE, marginLeft: 1, verticalAlign: "text-bottom", animation: "tw-blink 0.8s step-end infinite" }} />}
          </span>
        </div>
      </div>
    )
  }

  return (
    <section style={{ borderTop: `1px solid rgba(237,238,240,0.07)`, padding: "80px 32px", background: BG }}>
      <style>{`
        @keyframes tw-blink { 0%, 100% { opacity: 1 } 50% { opacity: 0 } }
        @media (max-width: 640px) {
          .tw-demo-grid { grid-template-columns: 1fr !important; }
          .tw-demo-left { display: none !important; }
        }
      `}</style>
      <div style={{ maxWidth: 1060, margin: "0 auto" }}>
        <div style={{ marginBottom: 48 }}>
          <p style={{ fontSize: "0.75rem", fontWeight: 700, color: BLUE, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 12 }}>
            See it work
          </p>
          <h2 style={{ fontSize: "clamp(1.5rem, 3vw, 2rem)", fontWeight: 800, letterSpacing: "-0.03em", color: TEXT, marginBottom: 12 }}>
            From checklist to client email in seconds.
          </h2>
          <p style={{ fontSize: "0.9rem", color: MUTED, maxWidth: 480 }}>
            Enter the matter details. TITLEwise reads the checklist state and drafts a professional update — ready to review and send.
          </p>
        </div>

        <div className="tw-demo-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2, borderRadius: 12, overflow: "hidden", border: `1px solid ${BORDER}`, boxShadow: "0 24px 64px rgba(0,0,0,0.4)" }}>

          {/* Left — form */}
          <div className="tw-demo-left" style={{ background: PANEL, padding: "28px 28px 24px" }}>
            <p style={{ fontSize: "0.6875rem", fontWeight: 700, color: DIM, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 20 }}>
              File Details
            </p>
            <Field fieldKey="client" label="Client Name" />
            <Field fieldKey="address" label="Property Address" />
            <Field fieldKey="stage" label="Current Stage" />
            <Field fieldKey="completed" label="Completed Items" multiline />

            <div style={{ marginTop: 20 }}>
              <div style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                background: emailStarted ? BLUE : "rgba(59,130,246,0.15)",
                border: `1px solid ${emailStarted ? BLUE : "rgba(59,130,246,0.3)"}`,
                borderRadius: 6, padding: "8px 16px",
                fontSize: "0.8125rem", fontWeight: 600, color: emailStarted ? "#fff" : "rgba(59,130,246,0.6)",
                transition: "all 0.3s",
              }}>
                {emailStarted ? (
                  <>
                    <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#fff", display: "inline-block" }} />
                    Generating...
                  </>
                ) : "Generate Status Update"}
              </div>
            </div>
          </div>

          {/* Right — email output */}
          <div style={{ background: "#0a0d12", padding: "28px 28px 24px", borderLeft: `1px solid ${BORDER}` }}>
            <p style={{ fontSize: "0.6875rem", fontWeight: 700, color: DIM, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 20 }}>
              Generated Email
            </p>
            <div style={{ fontFamily: "'SF Mono', 'Fira Code', monospace", fontSize: "0.775rem", color: MUTED, lineHeight: 1.7, whiteSpace: "pre-wrap", minHeight: 320 }}>
              {emailText}
              {emailStarted && emailText.length < EMAIL.length && (
                <span style={{ display: "inline-block", width: 1.5, height: "0.9em", background: BLUE, marginLeft: 1, verticalAlign: "text-bottom", animation: "tw-blink 0.8s step-end infinite" }} />
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
