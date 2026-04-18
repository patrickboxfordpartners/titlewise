import nodemailer from "nodemailer"

const transporter = nodemailer.createTransport({
  host: "email-smtp.us-east-1.amazonaws.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.SES_SMTP_USER,
    pass: process.env.SES_SMTP_PASS,
  },
})

const FROM = "TITLEwise <hello@boxfordpartners.com>"

type DripSequence = "welcome" | "day3" | "day7"

function getEmailContent(sequence: DripSequence, name: string, plan: string) {
  const firstName = name?.split(" ")[0] || "there"

  if (sequence === "welcome") {
    return {
      subject: "Welcome to TITLEwise — generate your first document in 2 minutes",
      html: `
        <div style="font-family: Inter, system-ui, sans-serif; max-width: 560px; margin: 0 auto; padding: 40px 20px; color: #111;">
          <div style="margin-bottom: 32px; font-size: 20px; font-weight: 700; letter-spacing: -0.5px;">TITLE<span style="font-weight: 400; color: #555;">wise</span></div>
          <h1 style="font-size: 24px; font-weight: 700; margin: 0 0 12px;">Welcome, ${firstName}.</h1>
          <p style="color: #555; line-height: 1.6; margin: 0 0 24px;">Your ${plan} plan is active. Here's how to save your first 30 minutes:</p>
          <ol style="color: #333; line-height: 1.8; padding-left: 20px; margin: 0 0 24px;">
            <li>Go to your <strong>Dashboard</strong> and pick any tool — Status Update is the fastest to try</li>
            <li>Fill in the client name, property address, and where you are in the closing</li>
            <li>Hit generate — you'll have a polished client email in under 30 seconds</li>
            <li>Copy or export to PDF and send directly</li>
          </ol>
          <a href="https://titlewise.app/dashboard" style="display: inline-block; background: #1a1a1a; color: #fff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px;">Open Dashboard →</a>
          <p style="color: #999; font-size: 12px; margin-top: 40px; line-height: 1.6;">You're receiving this because you subscribed to TITLEwise. <a href="https://titlewise.app" style="color: #999;">titlewise.app</a></p>
        </div>
      `,
    }
  }

  if (sequence === "day3") {
    return {
      subject: "The 8 tools in TITLEwise — which ones save you the most time",
      html: `
        <div style="font-family: Inter, system-ui, sans-serif; max-width: 560px; margin: 0 auto; padding: 40px 20px; color: #111;">
          <div style="margin-bottom: 32px; font-size: 20px; font-weight: 700; letter-spacing: -0.5px;">TITLE<span style="font-weight: 400; color: #555;">wise</span></div>
          <h1 style="font-size: 24px; font-weight: 700; margin: 0 0 12px;">Your 8 tools, ${firstName}</h1>
          <p style="color: #555; line-height: 1.6; margin: 0 0 20px;">TITLEwise has 8 tools built for closing attorneys. Here's what each one does:</p>
          <table style="width: 100%; border-collapse: collapse; margin: 0 0 24px;">
            ${[
              ["Status Update", "Polished client email from closing stage + task list"],
              ["Title Analysis", "Flag red flags in title commitments — requirements, exceptions, liens"],
              ["CD Review", "Catch fee discrepancies and RESPA issues in Closing Disclosures"],
              ["Wire Verification", "Draft fraud-prevention wire instruction confirmations"],
              ["HOA Review", "Summarize HOA certificates and flag transfer issues"],
              ["Fee Estimate", "Generate itemized closing cost estimates by transaction type"],
              ["Tax Proration", "Calculate property tax prorations with clear breakdowns"],
              ["Checklists", "Generate closing checklists by transaction type and state"],
            ].map(([name, desc]) => `
              <tr>
                <td style="padding: 10px 12px 10px 0; border-bottom: 1px solid #f0f0f0; font-weight: 600; font-size: 13px; vertical-align: top; white-space: nowrap;">${name}</td>
                <td style="padding: 10px 0; border-bottom: 1px solid #f0f0f0; color: #555; font-size: 13px;">${desc}</td>
              </tr>
            `).join("")}
          </table>
          <a href="https://titlewise.app/dashboard" style="display: inline-block; background: #1a1a1a; color: #fff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px;">Try a new tool →</a>
          <p style="color: #999; font-size: 12px; margin-top: 40px; line-height: 1.6;">You're receiving this because you subscribed to TITLEwise. <a href="https://titlewise.app" style="color: #999;">titlewise.app</a></p>
        </div>
      `,
    }
  }

  // day7
  return {
    subject: "How much time have you saved this week?",
    html: `
      <div style="font-family: Inter, system-ui, sans-serif; max-width: 560px; margin: 0 auto; padding: 40px 20px; color: #111;">
        <div style="margin-bottom: 32px; font-size: 20px; font-weight: 700; letter-spacing: -0.5px;">TITLE<span style="font-weight: 400; color: #555;">wise</span></div>
        <h1 style="font-size: 24px; font-weight: 700; margin: 0 0 12px;">One week in, ${firstName}</h1>
        <p style="color: #555; line-height: 1.6; margin: 0 0 16px;">The attorneys getting the most out of TITLEwise use it on every file — not just the complex ones. Even a straightforward refi gets a Status Update and a quick CD Review.</p>
        <p style="color: #555; line-height: 1.6; margin: 0 0 24px;">If you're on the ${plan === "solo" ? "Solo" : plan === "small_firm" ? "Small Firm" : "Team"} plan and want to add more seats, you can upgrade anytime from Settings.</p>
        <a href="https://titlewise.app/dashboard" style="display: inline-block; background: #1a1a1a; color: #fff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px; margin-right: 12px;">Open Dashboard →</a>
        <p style="color: #555; font-size: 13px; margin-top: 32px; line-height: 1.6;">Questions or feedback? Reply to this email — we read every one.</p>
        <p style="color: #999; font-size: 12px; margin-top: 24px; line-height: 1.6;">You're receiving this because you subscribed to TITLEwise. <a href="https://titlewise.app" style="color: #999;">titlewise.app</a></p>
      </div>
    `,
  }
}

export async function sendDripEmail({
  to,
  name,
  plan,
  sequence,
}: {
  to: string
  name: string
  plan: string
  sequence: DripSequence
}) {
  if (!process.env.SES_SMTP_USER || !process.env.SES_SMTP_PASS) {
    console.warn("[drip] SES credentials not set, skipping drip email")
    return
  }

  const { subject, html } = getEmailContent(sequence, name, plan)

  await transporter.sendMail({ from: FROM, to, subject, html })

  console.log(`[drip] Sent ${sequence} to ${to}`)
}
