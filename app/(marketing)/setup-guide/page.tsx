import type { Metadata } from 'next';
import LandingNav from '@/components/landing/LandingNav';

export const metadata: Metadata = {
  title: 'Setup Guide | TITLEwise',
  description: 'What to expect during your TITLEwise setup consultation.',
};

export default function SetupGuidePage() {
  const BG = "#0d253d";
  const PANEL = "#1c1e54";
  const BORDER = "#273951";
  const TEXT = "#ffffff";
  const MUTED = "#64748d";
  const DIM = "#64748d";
  const BLUE = "#533afd";

  return (
    <div style={{ minHeight: "100vh", background: BG }}>
      <LandingNav />
      <div style={{ maxWidth: 768, margin: "0 auto", padding: "112px 24px 80px" }}>
        <div style={{ marginBottom: 48 }}>
          <p style={{ fontSize: 11, fontWeight: 400, letterSpacing: "0.1em", textTransform: "uppercase", color: BLUE, marginBottom: 16 }}>Setup Guide</p>
          <h1 style={{ fontSize: 36, fontWeight: 300, color: TEXT, marginBottom: 16, letterSpacing: "-1.4px" }}>
            What to Expect
          </h1>
          <p style={{ color: MUTED, fontSize: 18, fontWeight: 300, lineHeight: 1.7 }}>
            Your setup consultation is booked. Here's how we'll get you live with TitleWise.
          </p>
        </div>

        {/* Upload Assets */}
        <section style={{ marginBottom: 64 }}>
          <div style={{ background: PANEL, border: `1px solid ${BLUE}33`, borderRadius: 8, padding: 32 }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 16, marginBottom: 24 }}>
              <svg style={{ width: 24, height: 24, color: BLUE, flexShrink: 0, marginTop: 4 }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <div style={{ flex: 1 }}>
                <h2 style={{ fontSize: 20, fontWeight: 300, color: TEXT, marginBottom: 8, letterSpacing: "-0.2px" }}>
                  Upload Your Practice Details Now
                </h2>
                <p style={{ color: MUTED, fontSize: 14, fontWeight: 300, lineHeight: 1.7, marginBottom: 16 }}>
                  Save time during your call by sharing your firm details, intake forms, and workflow preferences beforehand.
                </p>
                <a
                  href="https://titlewise.fillout.com/setup"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ display: "inline-block", background: BLUE, color: "white", fontWeight: 400, fontSize: 14, padding: "8px 16px", borderRadius: 9999, textDecoration: "none" }}
                >
                  Upload Practice Info
                </a>
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, paddingTop: 16, borderTop: `1px solid ${BORDER}` }}>
              <div style={{ textAlign: "center" }}>
                <p style={{ color: TEXT, fontSize: 11, fontWeight: 300, marginBottom: 4 }}>Intake Forms</p>
                <p style={{ color: DIM, fontSize: 9, fontWeight: 300 }}>PDF or Word docs</p>
              </div>
              <div style={{ textAlign: "center" }}>
                <p style={{ color: TEXT, fontSize: 11, fontWeight: 300, marginBottom: 4 }}>Closing Checklists</p>
                <p style={{ color: DIM, fontSize: 9, fontWeight: 300 }}>Templates & workflows</p>
              </div>
              <div style={{ textAlign: "center" }}>
                <p style={{ color: TEXT, fontSize: 11, fontWeight: 300, marginBottom: 4 }}>Brand Assets</p>
                <p style={{ color: DIM, fontSize: 9, fontWeight: 300 }}>Logo & letterhead</p>
              </div>
            </div>
          </div>
        </section>

        {/* Before Your Call */}
        <section style={{ marginBottom: 64 }}>
          <h2 style={{ fontSize: 24, fontWeight: 300, color: TEXT, marginBottom: 24, paddingBottom: 12, borderBottom: `1px solid ${BORDER}`, letterSpacing: "-0.48px" }}>
            Before Your Setup Call
          </h2>
          <p style={{ color: MUTED, fontSize: 14, fontWeight: 300, lineHeight: 1.7, marginBottom: 24 }}>
            Have these ready to make the most of our time together (or upload them above):
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: 16, background: PANEL, borderRadius: 6, border: `1px solid ${BORDER}` }}>
              <div style={{ width: 20, height: 20, borderRadius: "50%", border: `2px solid ${BLUE}`, flexShrink: 0, marginTop: 2 }} />
              <div>
                <p style={{ color: TEXT, fontSize: 14, fontWeight: 300, marginBottom: 4 }}>Current Intake Process</p>
                <p style={{ color: MUTED, fontSize: 12 }}>Your existing intake forms, client onboarding documents, and initial data collection process</p>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: 16, background: PANEL, borderRadius: 6, border: `1px solid ${BORDER}` }}>
              <div style={{ width: 20, height: 20, borderRadius: "50%", border: `2px solid ${BLUE}`, flexShrink: 0, marginTop: 2 }} />
              <div>
                <p style={{ color: TEXT, fontSize: 14, fontWeight: 300, marginBottom: 4 }}>Closing Workflow</p>
                <p style={{ color: MUTED, fontSize: 12 }}>Your step-by-step checklist from file opening to recording</p>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: 16, background: PANEL, borderRadius: 6, border: `1px solid ${BORDER}` }}>
              <div style={{ width: 20, height: 20, borderRadius: "50%", border: `2px solid ${BLUE}`, flexShrink: 0, marginTop: 2 }} />
              <div>
                <p style={{ color: TEXT, fontSize: 14, fontWeight: 300, marginBottom: 4 }}>Team Structure</p>
                <p style={{ color: MUTED, fontSize: 12 }}>Attorneys, paralegals, and staff who'll use the system</p>
              </div>
            </div>
          </div>
        </section>

        {/* During Your Call */}
        <section style={{ marginBottom: 64 }}>
          <h2 style={{ fontSize: 24, fontWeight: 300, color: TEXT, marginBottom: 24, paddingBottom: 12, borderBottom: `1px solid ${BORDER}` }}>
            During Your 30-Minute Setup Call
          </h2>

          <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
            {/* Step 1 */}
            <div style={{ borderLeft: `2px solid ${BLUE}`, paddingLeft: 24 }}>
              <div style={{ display: "flex", alignItems: "baseline", gap: 12, marginBottom: 12 }}>
                <span style={{ fontFamily: "monospace", fontSize: 11, letterSpacing: "0.1em", color: BLUE }}>STEP 1</span>
                <span style={{ color: DIM, fontSize: 11 }}>~10 minutes</span>
              </div>
              <h3 style={{ fontSize: 20, fontWeight: 300, color: TEXT, marginBottom: 8 }}>Intake Configuration</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 12, fontSize: 14 }}>
                <div>
                  <p style={{ color: MUTED, marginBottom: 4 }}><span style={{ color: TEXT, fontWeight: 300 }}>What we do:</span> Import your intake forms and map fields to TITLEwise</p>
                </div>
                <div>
                  <p style={{ color: MUTED, marginBottom: 4 }}><span style={{ color: TEXT, fontWeight: 300 }}>Why:</span> Client data flows automatically into your matter files</p>
                </div>
                <div>
                  <p style={{ color: MUTED }}><span style={{ color: TEXT, fontWeight: 300 }}>What you need:</span> Explain which fields are critical vs. optional</p>
                </div>
              </div>
            </div>

            {/* Step 2 */}
            <div style={{ borderLeft: `2px solid ${BLUE}`, paddingLeft: 24 }}>
              <div style={{ display: "flex", alignItems: "baseline", gap: 12, marginBottom: 12 }}>
                <span style={{ fontFamily: "monospace", fontSize: 11, letterSpacing: "0.1em", color: BLUE }}>STEP 2</span>
                <span style={{ color: DIM, fontSize: 11 }}>~10 minutes</span>
              </div>
              <h3 style={{ fontSize: 20, fontWeight: 300, color: TEXT, marginBottom: 8 }}>Closing Workflow Setup</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 12, fontSize: 14 }}>
                <div>
                  <p style={{ color: MUTED, marginBottom: 4 }}><span style={{ color: TEXT, fontWeight: 300 }}>What we do:</span> Build your closing checklist with automated deadline tracking</p>
                </div>
                <div>
                  <p style={{ color: MUTED, marginBottom: 4 }}><span style={{ color: TEXT, fontWeight: 300 }}>Why:</span> Every team member knows what's due and nothing falls through the cracks</p>
                </div>
                <div>
                  <p style={{ color: MUTED }}><span style={{ color: TEXT, fontWeight: 300 }}>What you need:</span> Confirm task order and typical timelines</p>
                </div>
              </div>
            </div>

            {/* Step 3 */}
            <div style={{ borderLeft: `2px solid ${BLUE}`, paddingLeft: 24 }}>
              <div style={{ display: "flex", alignItems: "baseline", gap: 12, marginBottom: 12 }}>
                <span style={{ fontFamily: "monospace", fontSize: 11, letterSpacing: "0.1em", color: BLUE }}>STEP 3</span>
                <span style={{ color: DIM, fontSize: 11 }}>~10 minutes</span>
              </div>
              <h3 style={{ fontSize: 20, fontWeight: 300, color: TEXT, marginBottom: 8 }}>Testing & Launch</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 12, fontSize: 14 }}>
                <div>
                  <p style={{ color: MUTED, marginBottom: 4 }}><span style={{ color: TEXT, fontWeight: 300 }}>What we do:</span> Create a test matter, add your team, verify workflow</p>
                </div>
                <div>
                  <p style={{ color: MUTED, marginBottom: 4 }}><span style={{ color: TEXT, fontWeight: 300 }}>Why:</span> Everyone is comfortable before the first real file</p>
                </div>
                <div>
                  <p style={{ color: MUTED }}><span style={{ color: TEXT, fontWeight: 300 }}>What you need:</span> Team member email addresses</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* After Your Call */}
        <section style={{ marginBottom: 64 }}>
          <h2 style={{ fontSize: 24, fontWeight: 300, color: TEXT, marginBottom: 24, paddingBottom: 12, borderBottom: `1px solid ${BORDER}` }}>
            After Your Call
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
              <svg style={{ width: 20, height: 20, color: BLUE, flexShrink: 0, marginTop: 2 }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <p style={{ color: MUTED, fontSize: 14 }}>You can start opening matters immediately</p>
            </div>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
              <svg style={{ width: 20, height: 20, color: BLUE, flexShrink: 0, marginTop: 2 }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <p style={{ color: MUTED, fontSize: 14 }}>Team invites sent to all staff members</p>
            </div>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
              <svg style={{ width: 20, height: 20, color: BLUE, flexShrink: 0, marginTop: 2 }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <p style={{ color: MUTED, fontSize: 14 }}>14-day white-glove support period begins</p>
            </div>
          </div>
        </section>

        {/* Questions */}
        <section style={{ background: PANEL, border: `1px solid ${BORDER}`, borderRadius: 8, padding: 32, textAlign: "center" }}>
          <h2 style={{ fontSize: 20, fontWeight: 300, color: TEXT, marginBottom: 12 }}>Questions Before Your Call?</h2>
          <p style={{ color: MUTED, fontSize: 14, marginBottom: 24 }}>
            We're here to help. Reach out anytime.
          </p>
          <a
            href="mailto:hello@titlewise.app"
            style={{ display: "inline-block", background: BLUE, color: "white", fontWeight: 300, fontSize: 14, padding: "12px 24px", borderRadius: 6, textDecoration: "none" }}
          >
            Email Us
          </a>
        </section>

        {/* Back Link */}
        <div style={{ marginTop: 48, textAlign: "center" }}>
          <Link href="/" style={{ color: BLUE, fontSize: 14, textDecoration: "none" }}>
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
