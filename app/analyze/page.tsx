"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { Upload, FileText, X, Sparkles, Loader2, AlertTriangle, CheckCircle, Check, Phone, ShieldAlert, Clock, Ban } from "lucide-react"
import ThemeToggle from "@/components/ThemeToggle"
import { useThemeColors } from "@/lib/useThemeColors"

const AGENT_URL = process.env.NEXT_PUBLIC_AGENT_URL || "https://titlewise-agent.patrick-54b.workers.dev"

const FONT_SANS = "Inter, 'SF Pro Display', system-ui, -apple-system, sans-serif"
const FONT_MONO = "'JetBrains Mono', 'SF Mono', Monaco, monospace"

interface AgentEvent {
  stage: string
  agent: string
  status: "start" | "progress" | "complete" | "error"
  message: string
  data?: any
  elapsed: number
}

interface DealFacts {
  property: { address: string | null; apn: string | null }
  parties: { buyers: string[]; sellers: string[]; lender: string | null }
  transaction: { fileNumber: string | null; purchasePrice: string | null; loanAmount: string | null; cashToClose: string | null; closingDate: string | null }
  loan: { lender: string | null; type: string | null; rate: string | null; amount: string | null }
  titleCompany: { name: string | null; officer: string | null; phone: string | null }
  wire: { bank: string | null; routing: string | null; beneficiary: string | null; amount: string | null }
  milestones: Record<string, boolean>
  flags: string[]
  entities: { beneficiaries: string[]; routingNumbers: string[]; banks: string[]; amounts: string[]; addresses: string[] }
  verifiedEntities: Record<string, "verified" | "unverified" | "mismatch">
}

const EMPTY_DEAL: DealFacts = {
  property: { address: null, apn: null },
  parties: { buyers: [], sellers: [], lender: null },
  transaction: { fileNumber: null, purchasePrice: null, loanAmount: null, cashToClose: null, closingDate: null },
  loan: { lender: null, type: null, rate: null, amount: null },
  titleCompany: { name: null, officer: null, phone: null },
  wire: { bank: null, routing: null, beneficiary: null, amount: null },
  milestones: { preQual: false, application: false, appraisal: false, titleSearch: false, underwriting: false, conditionalApproval: false, clearToClose: false, funded: false },
  flags: [],
  entities: { beneficiaries: [], routingNumbers: [], banks: [], amounts: [], addresses: [] },
  verifiedEntities: {},
}

const STAGE_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  pipeline:      { bg: "#1e293b", text: "#94a3b8", label: "Coordinator" },
  extract:       { bg: "#164e63", text: "#67e8f9", label: "Extract" },
  analysis:      { bg: "#3b0764", text: "#d8b4fe", label: "Analyst" },
  tavily:        { bg: "#422006", text: "#fbbf24", label: "Web Verify" },
  memory:        { bg: "#052e16", text: "#86efac", label: "Memory" },
  adversarial:   { bg: "#7f1d1d", text: "#fca5a5", label: "Panel" },
  synthesis:     { bg: "#1e1b4b", text: "#a5b4fc", label: "Synthesis" },
  alert:         { bg: "#7f1d1d", text: "#fca5a5", label: "Alert" },
  records:       { bg: "#1c1917", text: "#d6d3d1", label: "Records" },
  audit:         { bg: "#312e81", text: "#a5b4fc", label: "Audit" },
  "audit-trail": { bg: "#052e16", text: "#86efac", label: "Trail" },
  pattern:       { bg: "#052e16", text: "#86efac", label: "Pattern" },
  frauddb:       { bg: "#052e16", text: "#86efac", label: "Fraud DB" },
}

const TOOLS = [
  { key: "auto", label: "Full Analysis" },
  { key: "verify_wire", label: "Wire Fraud" },
  { key: "analyze_commitment", label: "Title Commitment" },
  { key: "analyze_closing_disclosure", label: "Closing Disclosure" },
  { key: "review_hoa", label: "HOA" },
]

const SAMPLE_DOCS: Record<string, { label: string; text: string }> = {
  wire_safe: {
    label: "Wire (Safe)",
    text: `WIRE TRANSFER INSTRUCTIONS
File No: 2024-SM-78432
Closing Date: March 15, 2024

Property Address: 742 Evergreen Terrace, San Mateo, CA 94401
APN: 035-123-456

Buyer: Michael and Sarah Chen, husband and wife as community property
Seller: Robert J. Thompson

Purchase Price: $1,285,000
Loan Amount: $1,028,000
Cash to Close: $257,000

LENDER: First Republic Bank
30-Year Fixed
Interest Rate: 6.875%

Settlement Agent: First American Title Company
Escrow Officer: Jennifer Martinez
Direct: (650) 555-0142

WIRE INSTRUCTIONS:
Bank: JPMorgan Chase
Routing: 021000089
Account: 483291756
Beneficiary: Pacific Coast Settlements LLC
Amount: $257,000.00
Reference: File #2024-SM-78432

IMPORTANT: Always verify wire instructions by calling (650) 555-0142.`,
  },
  wire_fraud: {
    label: "Wire (BEC)",
    text: `UPDATED WIRE TRANSFER INSTRUCTIONS — PLEASE USE THESE
File No: 2024-SM-78432
Closing Date: March 15, 2024

Property Address: 742 Evergreen Terrace, San Mateo, CA 94401
APN: 035-123-456

Buyer: Michael and Sarah Chen
Seller: Robert J. Thompson

Purchase Price: $1,285,000
Loan Amount: $1,028,000
Cash to Close: $257,000

LENDER: First Republic Bank

Settlement Agent: First American Title Company

UPDATED WIRE INSTRUCTIONS — PLEASE DISREGARD PREVIOUS:
Bank: Bank of the West
Routing: 021000021
Account: 927461038
Beneficiary: Pacfic Coast Setlements LLC
Amount: $847,921.00
Reference: File #2024-SM-78432

Please wire funds IMMEDIATELY as closing is tomorrow. Do NOT call the office as we are in meetings all day. Reply to this email to confirm.`,
  },
  commitment: {
    label: "Commitment",
    text: `COMMITMENT FOR TITLE INSURANCE
File Number: NCS-1047832-SM

Effective Date: February 28, 2024
Proposed Insured: Michael Chen and Sarah Chen

Property Address: 742 Evergreen Terrace, San Mateo, CA 94401
APN: 035-123-456

Title Vested In: Robert J. Thompson, a single man

AMOUNT OF INSURANCE:
Owner's Policy: $1,285,000
Lender's Policy: $1,028,000

REQUIREMENTS:
1. Deed from Robert J. Thompson to Michael Chen and Sarah Chen
2. Deed of Trust from Michael Chen and Sarah Chen to First Republic Bank
3. Proof of payment of all property taxes through closing

EXCEPTIONS FROM COVERAGE:
1. General and special taxes for the fiscal year 2024-2025
2. Easement for public utilities recorded March 12, 1987
3. CC&Rs recorded June 15, 1965, as Document No. 1965-045678

Prepared by: First American Title Company
Title Officer: Jennifer Martinez
Phone: (650) 555-0142`,
  },
  closing_disclosure: {
    label: "CD",
    text: `CLOSING DISCLOSURE
File Number: 2024-SM-78432
Closing Date: March 15, 2024

BORROWER: Michael Chen and Sarah Chen
742 Evergreen Terrace, San Mateo, CA 94401

SELLER: Robert J. Thompson

LENDER: First Republic Bank

LOAN TERMS:
Loan Amount: $1,028,000
Interest Rate: 6.875%
30-Year Fixed

PROJECTED PAYMENTS:
Monthly Principal & Interest: $6,753.42
Estimated Escrow: $1,284.17
Estimated Total Payment: $8,037.59

COSTS AT CLOSING:
Purchase Price: $1,285,000
Total Closing Costs: $18,432.00
Cash to Close: $275,432.00

Settlement Agent: First American Title Company
Escrow Officer: Jennifer Martinez`,
  },
  hoa: {
    label: "HOA",
    text: `HOA DISCLOSURE PACKET
Evergreen Terrace Homeowners Association

Property: 742 Evergreen Terrace, San Mateo, CA 94401
Buyer: Michael and Sarah Chen

Monthly Assessment: $425.00
Special Assessment: None pending

Reserve Fund Balance: $1,247,000 (as of January 2024)
Percent Funded: 78%

PENDING LITIGATION: None
PENDING SPECIAL ASSESSMENTS: None
DELINQUENT ASSESSMENTS ON UNIT: None

CC&R Violations on Unit: None

Transfer Fee: $250.00 (due at closing)
Document Fee: $150.00

Board Contact: management@evergreenhoasm.org`,
  },
}
const SAMPLES = Object.entries(SAMPLE_DOCS).map(([key, v]) => ({ key, label: v.label }))

const MILESTONES: [string, string][] = [
  ["preQual", "Pre-Qualification"],
  ["application", "Loan Application"],
  ["appraisal", "Appraisal"],
  ["titleSearch", "Title Search"],
  ["underwriting", "Underwriting"],
  ["conditionalApproval", "Conditional Approval"],
  ["clearToClose", "Clear to Close"],
  ["funded", "Funded"],
]

function extractDealInfo(text: string, deal: DealFacts, activeTool: string): DealFacts {
  const d = { ...deal }
  d.property = { ...d.property }
  d.parties = { ...d.parties, buyers: [...d.parties.buyers], sellers: [...d.parties.sellers] }
  d.transaction = { ...d.transaction }
  d.loan = { ...d.loan }
  d.titleCompany = { ...d.titleCompany }
  d.wire = { ...d.wire }
  d.milestones = { ...d.milestones }

  const fileMatch = text.match(/File\s*(?:No|#|Number)?:?\s*([\w-]+)/i)
  if (fileMatch) d.transaction.fileNumber = fileMatch[1]

  const closingMatch = text.match(/Closing\s*Date:?\s*([\w\s,]+\d{4})/i)
  if (closingMatch) d.transaction.closingDate = closingMatch[1].trim()

  const propertyMatch = text.match(/Property(?:\s*Address)?:?\s*([\d]+[^\n]{10,})/i)
  if (propertyMatch && !d.property.address) d.property.address = propertyMatch[1].trim()

  const apnMatch = text.match(/APN:?\s*([\d-]+)/i)
  if (apnMatch) d.property.apn = apnMatch[1]

  const buyerMatch = text.match(/(?:Proposed\s*Insured|BORROWER|Buyer|Grantee):?\s*(.+?)(?:\n|$)/i)
  if (buyerMatch) {
    const buyer = buyerMatch[1].trim().replace(/,?\s*(?:husband and wife|as community property|as joint tenants).*$/i, "").trim()
    if (buyer && !d.parties.buyers.includes(buyer)) d.parties.buyers.push(buyer)
  }

  const sellerMatch = text.match(/(?:SELLER|Title\s*Vested\s*In|Grantor|OWNER):?\s*(.+?)(?:\n|$)/i)
  if (sellerMatch) {
    const seller = sellerMatch[1].trim()
    if (seller && !d.parties.sellers.includes(seller)) d.parties.sellers.push(seller)
  }

  const lenderMatch = text.match(/(?:LENDER|Lender):?\s*(.+?)(?:\n|$)/i)
  if (lenderMatch) { d.parties.lender = lenderMatch[1].trim(); d.loan.lender = lenderMatch[1].trim() }

  const loanTypeMatch = text.match(/(\d+[- ]Year\s+Fixed|ARM|Adjustable|FHA|VA|Conventional|Jumbo)/i)
  if (loanTypeMatch) d.loan.type = loanTypeMatch[1]

  const rateMatch = text.match(/Interest\s*Rate:?\s*([\d.]+%)/i)
  if (rateMatch) d.loan.rate = rateMatch[1]

  const priceMatch = text.match(/Purchase\s*Price:?\s*(\$[\d,.]+)/i)
  if (priceMatch) d.transaction.purchasePrice = priceMatch[1]

  const loanAmtMatch = text.match(/Loan\s*Amount:?\s*(\$[\d,.]+)/i)
  if (loanAmtMatch) { d.transaction.loanAmount = loanAmtMatch[1]; d.loan.amount = loanAmtMatch[1] }

  const cashMatch = text.match(/(?:TOTAL\s*)?Cash\s*to\s*Close:?\s*(\$[\d,.]+)/i)
  if (cashMatch) d.transaction.cashToClose = cashMatch[1]

  const titleCoMatch = text.match(/(?:Settlement\s*Agent|Prepared\s*by):?\s*((?:Meridian|First\s*American|Chicago|Fidelity|Old\s*Republic|Stewart)[^\n]*)/i)
  if (titleCoMatch && !d.titleCompany.name) d.titleCompany.name = titleCoMatch[1].trim()

  const officerMatch = text.match(/(?:Escrow\s*Officer|Title\s*Officer):?\s*(.+?)(?:\n|$)/i)
  if (officerMatch) d.titleCompany.officer = officerMatch[1].trim()

  const phoneMatch = text.match(/(?:Direct|Phone|Tel):?\s*([\(\)\d\s.-]+(?:ext\.?\s*\d+)?)/i)
  if (phoneMatch) d.titleCompany.phone = phoneMatch[1].trim()

  const bankMatch = text.match(/Bank:?\s*(.+?)(?:\n|$)/i)
  if (bankMatch) d.wire.bank = bankMatch[1].trim()

  const routingMatchW = text.match(/Routing:?\s*(\d{9})/i)
  if (routingMatchW) d.wire.routing = routingMatchW[1]

  const beneficiaryMatch = text.match(/Beneficiary:?\s*(.+?)(?:\n|$)/i)
  if (beneficiaryMatch) d.wire.beneficiary = beneficiaryMatch[1].trim()

  const amountMatch = text.match(/Amount:?\s*(\$[\d,.]+)/i)
  if (amountMatch) d.wire.amount = amountMatch[1]

  if (d.loan.lender || d.loan.amount) { d.milestones.preQual = true; d.milestones.application = true }
  if (text.match(/apprais/i) || d.transaction.purchasePrice) d.milestones.appraisal = true
  if (activeTool === "analyze_commitment" || text.match(/COMMITMENT FOR TITLE/i)) d.milestones.titleSearch = true
  if (d.loan.lender && d.transaction.loanAmount) d.milestones.underwriting = true
  if (activeTool === "analyze_closing_disclosure" || text.match(/CLOSING DISCLOSURE/i)) { d.milestones.conditionalApproval = true; d.milestones.clearToClose = true }

  return d
}

export default function AnalyzePage() {
  const c = useThemeColors()
  const inputRef = useRef<HTMLInputElement>(null)
  const logRef = useRef<HTMLDivElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [textInput, setTextInput] = useState("")
  const [tool, setTool] = useState("auto")
  const [running, setRunning] = useState(false)
  const [events, setEvents] = useState<AgentEvent[]>([])
  const [verdict, setVerdict] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [agentCount, setAgentCount] = useState(0)
  const [deal, setDeal] = useState<DealFacts>(EMPTY_DEAL)
  const [docCount, setDocCount] = useState(0)
  const [dealStatus, setDealStatus] = useState<"waiting" | "progress" | "ready" | "hold">("waiting")
  const [alertTime, setAlertTime] = useState<number | null>(null)
  const [alertElapsed, setAlertElapsed] = useState(0)
  const [notifyStatus, setNotifyStatus] = useState<"idle" | "sending" | "sent" | "error">("idle")
  const dealRef = useRef<DealFacts>(EMPTY_DEAL)

  useEffect(() => { dealRef.current = deal }, [deal])

  useEffect(() => {
    if (!alertTime) { setAlertElapsed(0); return }
    const id = setInterval(() => setAlertElapsed(Math.floor((Date.now() - alertTime) / 1000)), 1000)
    return () => clearInterval(id)
  }, [alertTime])

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight
  }, [events])

  function updateDealFromEvent(evt: AgentEvent, currentDeal: DealFacts): DealFacts {
    const d = { ...currentDeal }
    d.entities = { ...d.entities, beneficiaries: [...d.entities.beneficiaries], routingNumbers: [...d.entities.routingNumbers], banks: [...d.entities.banks], amounts: [...d.entities.amounts], addresses: [...d.entities.addresses] }
    d.verifiedEntities = { ...d.verifiedEntities }
    d.flags = [...d.flags]

    if (evt.stage === "extract" && evt.status === "complete" && evt.data) {
      const data = evt.data
      data.beneficiaries?.forEach((b: string) => { if (!d.entities.beneficiaries.includes(b)) d.entities.beneficiaries.push(b) })
      data.routingNumbers?.forEach((r: string) => { if (!d.entities.routingNumbers.includes(r)) d.entities.routingNumbers.push(r) })
      data.banks?.forEach((b: string) => { if (!d.entities.banks.includes(b)) d.entities.banks.push(b) })
      data.amounts?.forEach((a: string) => { if (!d.entities.amounts.includes(a)) d.entities.amounts.push(a) })
      data.addresses?.forEach((a: string) => { if (!d.entities.addresses.includes(a)) d.entities.addresses.push(a) })
    }

    if (evt.stage === "tavily" && evt.status === "progress" && evt.data) {
      const v = evt.data
      if (v.entity) d.verifiedEntities[v.entity] = v.verified ? "verified" : "unverified"
    }

    if (evt.stage === "audit" && evt.status === "progress" && evt.data?.field) {
      const ad = evt.data
      d.flags.push(`${ad.field.replace(/_/g, " ")}: "${ad.current_value}" vs "${ad.prior_value}" (${ad.prior_document})`)
    }

    return d
  }

  function handleDrop(e: React.DragEvent) { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) { setFile(f); setError(null) } }
  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) { const f = e.target.files?.[0]; if (f) { setFile(f); setError(null) } }

  async function startStream(url: string, body: object) {
    const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
    if (!res.ok) throw new Error(`${res.status}`)
    const reader = res.body?.getReader()
    if (!reader) throw new Error("No stream")
    const decoder = new TextDecoder()
    let buffer = ""
    let currentDeal = dealRef.current

    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split("\n")
      buffer = lines.pop() || ""
      for (const line of lines) {
        if (!line.startsWith("data: ")) continue
        try {
          const evt = JSON.parse(line.slice(6))
          if (evt.stage === "final") {
            setVerdict(evt.data)
            const p = evt.data?.pipeline || evt.data?.analyses?.[0]?.pipeline
            setAgentCount(p?.agents_invoked?.length || p?.total_agents || evt.data?.pipeline?.total_agents || 0)
            continue
          }
          setEvents(prev => [...prev, evt as AgentEvent])
          currentDeal = updateDealFromEvent(evt, currentDeal)
          dealRef.current = currentDeal
          setDeal(currentDeal)
        } catch {}
      }
    }
  }

  async function fireNotify(dealData: DealFacts, action: string) {
    setNotifyStatus("sending")
    try {
      await fetch(`${AGENT_URL}/api/notify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          mode: "both",
          dealInfo: {
            property: dealData.property.address || "Unknown property",
            fileNumber: dealData.transaction.fileNumber || "N/A",
            buyers: dealData.parties.buyers,
            sellers: dealData.parties.sellers,
            status: "hold",
            flags: dealData.flags,
          },
        }),
      })
      setNotifyStatus("sent")
    } catch {
      setNotifyStatus("error")
    }
  }

  function resetAnalysis() {
    setRunning(false); setEvents([]); setVerdict(null); setError(null); setAgentCount(0)
    setAlertTime(null); setNotifyStatus("idle")
  }

  async function runPipelineOn(documentText: string, activeTool: string) {
    resetAnalysis()
    setRunning(true)

    const updated = extractDealInfo(documentText, EMPTY_DEAL, activeTool)
    dealRef.current = updated
    setDeal(updated)
    setDocCount(prev => prev + 1)

    try {
      await startStream(`${AGENT_URL}/api/stream`, { tool: activeTool, document_text: documentText })
    } catch (e: any) { setError(e.message) }
    setRunning(false)
  }

  async function runAnalysis() {
    let documentText = textInput.trim()

    if (file && !documentText) {
      resetAnalysis(); setRunning(true)
      setEvents([{ stage: "pipeline", agent: "Closing Coordinator", status: "start", message: `Uploading ${file.name}...`, elapsed: 0 }])
      try {
        const formData = new FormData(); formData.append("file", file)
        const r = await fetch(`${AGENT_URL}/api/upload`, { method: "POST", body: formData })
        const d = await r.json()
        if (d.success && d.text) {
          documentText = d.text
          setEvents(prev => [...prev, { stage: "extract", agent: "Document Reader", status: "complete", message: `Extracted ${documentText.length.toLocaleString()} chars`, elapsed: 0 }])
        } else { setError("Could not extract text."); setRunning(false); return }
      } catch { setError("Upload failed."); setRunning(false); return }
    }

    if (!documentText || documentText.length < 20) { setError("Need at least 20 characters."); return }
    await runPipelineOn(documentText, tool)
  }

  async function runDemo(sampleKey: string) {
    const sample = SAMPLE_DOCS[sampleKey]
    if (!sample) return
    setTextInput(sample.text)
    await runPipelineOn(sample.text, "auto")
  }

  function loadSample(sampleKey: string) {
    const sample = SAMPLE_DOCS[sampleKey]
    if (sample) setTextInput(sample.text)
  }

  const rs = verdict?.risk_synthesis
    || verdict?.analyses?.[0]?.risk_synthesis
    || null
  const riskLevel = rs?.risk_level || ""
  const riskScore = rs?.composite_risk_score ?? null
  const isHighRisk = riskLevel === "CRITICAL" || (riskLevel === "HIGH" && (riskScore ?? 0) >= 60)
  const pipelineInfo = verdict?.pipeline || verdict?.analyses?.[0]?.pipeline || null
  const hasFlags = deal.flags.length > 0
  const checkedCount = Object.values(deal.milestones).filter(Boolean).length

  useEffect(() => {
    if (hasFlags) setDealStatus("hold")
    else if (checkedCount >= 6 && deal.property.address && deal.wire.routing) setDealStatus("ready")
    else if (docCount > 0) setDealStatus("progress")
    else setDealStatus("waiting")
  }, [hasFlags, checkedCount, deal.property.address, deal.wire.routing, docCount])

  useEffect(() => {
    if (isHighRisk && !alertTime) {
      setAlertTime(Date.now())
      fireNotify(dealRef.current, "hold_all_parties")
    }
  }, [isHighRisk])

  function formatElapsed(s: number): string {
    const m = Math.floor(s / 60)
    const sec = s % 60
    return m > 0 ? `${m}m ${sec}s` : `${sec}s`
  }

  const border = c.hairline
  const panelBg = c.cardBg
  const dimText = c.muted

  return (
    <div style={{ backgroundColor: c.bg, height: "100vh", color: c.ink, fontFamily: FONT_SANS, fontWeight: 300, fontFeatureSettings: '"ss01"', display: "flex", flexDirection: "column", overflow: "hidden" }}>
      {/* Nav */}
      <nav style={{ backgroundColor: c.navBg, backdropFilter: "blur(12px)", borderBottom: `1px solid ${border}`, flexShrink: 0 }}>
        <div style={{ padding: "0 20px", height: 48, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Link href="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 8 }}>
            <svg height="22" viewBox="0 0 36 43" fill="none"><rect x="10" y="0" width="24" height="32" rx="4" fill={c.isDark ? "rgba(255,255,255,0.25)" : "#93c5fd"} /><rect x="2" y="8" width="24" height="32" rx="4" fill={c.primary} /></svg>
            <span style={{ fontSize: "1rem", letterSpacing: "-0.02em" }}><span style={{ fontWeight: 600, color: c.ink }}>TITLE</span><span style={{ fontWeight: 300, color: dimText }}>wise</span></span>
          </Link>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: "0.6875rem", fontWeight: 500, color: dimText, textTransform: "uppercase", letterSpacing: "0.08em" }}>Live Analysis</span>
            <ThemeToggle />
          </div>
        </div>
      </nav>

      {/* 3-Column Layout */}
      <div style={{ flex: 1, display: "grid", gridTemplateColumns: "1fr 1fr 1.5fr", overflow: "hidden" }}>

        {/* LEFT: Source Document */}
        <div style={{ display: "flex", flexDirection: "column", borderRight: `1px solid ${border}`, overflow: "hidden" }}>
          <div style={{ padding: "8px 14px", borderBottom: `1px solid ${border}`, backgroundColor: panelBg, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: "0.6875rem", fontWeight: 500, color: dimText, textTransform: "uppercase", letterSpacing: "0.08em" }}>Source Document</span>
            <span style={{ fontSize: "0.625rem", padding: "2px 8px", borderRadius: 4, backgroundColor: c.isDark ? "#1e293b" : "#e2e8f0", color: dimText }}>INPUT</span>
          </div>

          {/* Tool selector */}
          <div style={{ display: "flex", gap: 4, padding: "8px 14px", borderBottom: `1px solid ${border}`, flexWrap: "wrap" }}>
            {TOOLS.map(t => (
              <button key={t.key} onClick={() => setTool(t.key)} style={{
                padding: "4px 10px", borderRadius: 4, fontSize: "0.6875rem", fontWeight: 500,
                border: `1px solid ${tool === t.key ? c.primary : border}`,
                backgroundColor: tool === t.key ? (c.isDark ? "rgba(59,130,246,0.15)" : "#e3f2fd") : "transparent",
                color: tool === t.key ? c.primary : dimText, cursor: "pointer",
              }}>{t.label}</button>
            ))}
          </div>

          {/* Sample buttons */}
          <div style={{ display: "flex", gap: 4, padding: "6px 14px", borderBottom: `1px solid ${border}` }}>
            {SAMPLES.map((s, i) => (
              <button key={s.key} onClick={() => loadSample(s.key)} style={{
                padding: "3px 8px", borderRadius: 3, fontSize: "0.625rem",
                border: `1px solid ${border}`, backgroundColor: "transparent", color: dimText, cursor: "pointer",
              }}>{i + 1}. {s.label}</button>
            ))}
          </div>

          {/* File upload */}
          <div
            onDrop={handleDrop} onDragOver={e => e.preventDefault()}
            onClick={() => !file && inputRef.current?.click()}
            style={{ padding: "10px 14px", borderBottom: `1px solid ${border}`, cursor: file ? "default" : "pointer", backgroundColor: c.isDark ? "#09090b" : "#fafbfc" }}
          >
            <div style={{ border: `1px dashed ${file ? c.primary : border}`, borderRadius: 6, padding: "8px 12px", fontSize: "0.6875rem", color: dimText, textAlign: "center" }}>
              {file ? (
                <span style={{ display: "flex", alignItems: "center", gap: 6, justifyContent: "center" }}>
                  <FileText size={14} color={c.primary} />
                  <span style={{ color: c.ink, fontWeight: 500 }}>{file.name}</span>
                  <button onClick={e => { e.stopPropagation(); setFile(null) }} style={{ background: "none", border: "none", cursor: "pointer", color: dimText, padding: 0 }}><X size={12} /></button>
                </span>
              ) : (
                <span>Drop file here or <span style={{ color: c.primary, textDecoration: "underline" }}>browse</span></span>
              )}
            </div>
            <input ref={inputRef} type="file" accept=".pdf,.txt,.doc,.docx" onChange={handleFileInput} style={{ display: "none" }} />
          </div>

          {/* Text area */}
          <textarea
            value={textInput} onChange={e => setTextInput(e.target.value)}
            placeholder="Paste wire instructions, title commitment, closing disclosure, or HOA document here..."
            style={{
              flex: 1, backgroundColor: c.isDark ? "#09090b" : "#fafbfc", border: "none", padding: "12px 14px",
              fontFamily: FONT_MONO, fontSize: "0.72rem", lineHeight: 1.5,
              color: c.ink, resize: "none", outline: "none",
            }}
          />

          {error && <p style={{ fontSize: "0.72rem", color: "#ef4444", padding: "6px 14px" }}>{error}</p>}

          {/* Action bar */}
          <div style={{ padding: "10px 14px", borderTop: `1px solid ${border}`, backgroundColor: panelBg, display: "flex", gap: 8, alignItems: "center" }}>
            <button onClick={() => runDemo("wire_safe")} disabled={running} style={{
              padding: "8px 16px", borderRadius: 6, border: "none", fontSize: "0.8125rem", fontWeight: 600,
              backgroundColor: "#22c55e", color: "#fff", cursor: running ? "not-allowed" : "pointer", opacity: running ? 0.5 : 1,
            }}>Safe Wire</button>
            <button onClick={() => runDemo("wire_fraud")} disabled={running} style={{
              padding: "8px 16px", borderRadius: 6, border: "none", fontSize: "0.8125rem", fontWeight: 600,
              backgroundColor: "#ef4444", color: "#fff", cursor: running ? "not-allowed" : "pointer", opacity: running ? 0.5 : 1,
            }}>BEC Attack</button>
            <button onClick={runAnalysis} disabled={running || (!file && textInput.length < 20)} style={{
              padding: "8px 16px", borderRadius: 6, border: `1px solid ${border}`, fontSize: "0.8125rem", fontWeight: 500,
              backgroundColor: panelBg, color: c.ink, cursor: running ? "not-allowed" : "pointer", opacity: running || (!file && textInput.length < 20) ? 0.5 : 1,
            }}>{running ? "Analyzing..." : "Analyze"}</button>
            {running && <Loader2 size={16} color={c.primary} className="animate-spin" />}
          </div>
        </div>

        {/* CENTER: Deal Facts */}
        <div style={{ display: "flex", flexDirection: "column", borderRight: `1px solid ${border}`, overflow: "hidden" }}>
          <div style={{ padding: "8px 14px", borderBottom: `1px solid ${border}`, backgroundColor: panelBg, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: "0.6875rem", fontWeight: 500, color: dimText, textTransform: "uppercase", letterSpacing: "0.08em" }}>Deal Facts</span>
            <span style={{ fontSize: "0.625rem", padding: "2px 8px", borderRadius: 4, backgroundColor: c.isDark ? "#1e293b" : "#e2e8f0", color: dimText }}>{docCount} doc{docCount !== 1 ? "s" : ""}</span>
          </div>

          {/* Deal status */}
          {isHighRisk ? (
            /* CRITICAL TAKEOVER */
            <>
              <div style={{
                padding: "14px", borderBottom: `2px solid #ef4444`,
                backgroundColor: c.isDark ? "rgba(127,29,29,0.25)" : "#fef2f2",
                textAlign: "center",
              }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 6 }}>
                  <ShieldAlert size={20} color="#ef4444" />
                  <span style={{ fontSize: "0.875rem", fontWeight: 600, color: "#ef4444", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                    Transaction Frozen
                  </span>
                  <ShieldAlert size={20} color="#ef4444" />
                </div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                  <Clock size={12} color="#fca5a5" />
                  <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "#fca5a5", fontFamily: FONT_MONO, fontVariantNumeric: "tabular-nums" }}>
                    Alert active: {formatElapsed(alertElapsed)}
                  </span>
                </div>
                <p style={{ fontSize: "0.625rem", color: "#fca5a5", marginTop: 4 }}>
                  {riskScore}/100 risk score -- {agentCount} agents flagged this document
                </p>
              </div>

              <div style={{ flex: 1, overflowY: "auto", padding: "14px", fontSize: "0.75rem" }}>
                {/* Notification status */}
                <div style={{
                  padding: "10px 12px", borderRadius: 6, marginBottom: 14,
                  backgroundColor: notifyStatus === "sent" ? (c.isDark ? "rgba(5,46,22,0.2)" : "#f0fdf4") : c.isDark ? "rgba(127,29,29,0.15)" : "#fef2f2",
                  border: `1px solid ${notifyStatus === "sent" ? "#4ade80" : "#f87171"}`,
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                    <Phone size={12} color={notifyStatus === "sent" ? "#4ade80" : "#f87171"} />
                    <span style={{ fontSize: "0.6875rem", fontWeight: 600, color: notifyStatus === "sent" ? "#4ade80" : "#f87171", textTransform: "uppercase" }}>
                      {notifyStatus === "sending" && "Dispatching alerts..."}
                      {notifyStatus === "sent" && "All parties notified via SMS + Voice"}
                      {notifyStatus === "error" && "Notification failed -- call manually"}
                      {notifyStatus === "idle" && "Preparing notifications..."}
                    </span>
                  </div>
                  <p style={{ fontSize: "0.625rem", color: dimText }}>
                    Closing coordinator, buyer agent, and seller agent have been instructed to HOLD.
                  </p>
                </div>

                {/* Response checklist */}
                <p style={{ fontSize: "0.625rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: "#f87171", marginBottom: 8 }}>
                  Immediate Response Required
                </p>

                <ResponseStep num={1} c={c} critical>
                  DO NOT wire any funds. Do not reply to the sender.
                </ResponseStep>

                {deal.titleCompany.name && (
                  <ResponseStep num={2} c={c} critical>
                    Call {deal.titleCompany.name}{deal.titleCompany.phone ? ` at ${deal.titleCompany.phone}` : ""} on a VERIFIED number to confirm wire instructions. Do not use contact info from this document.
                  </ResponseStep>
                )}
                {!deal.titleCompany.name && (
                  <ResponseStep num={2} c={c} critical>
                    Call your title company on a previously verified number. Do not use any contact info from this document.
                  </ResponseStep>
                )}

                <ResponseStep num={3} c={c}>
                  Compare routing number {deal.wire.routing || "(in document)"} against your original closing instructions.
                </ResponseStep>

                <ResponseStep num={4} c={c}>
                  If funds were already sent, contact your bank immediately to initiate a recall. Time is critical -- recovery window is 24-72 hours.
                </ResponseStep>

                <ResponseStep num={5} c={c}>
                  File a report with FBI IC3 (ic3.gov) and notify your state bar association.
                </ResponseStep>

                {/* Signals */}
                <p style={{ fontSize: "0.625rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: "#f87171", marginTop: 16, marginBottom: 6 }}>
                  Fraud Indicators ({(rs?.signals || []).length})
                </p>
                {(rs?.signals || []).map((s: string, i: number) => (
                  <div key={i} style={{
                    fontSize: "0.68rem", padding: "4px 8px", borderLeft: "3px solid #f87171",
                    backgroundColor: c.isDark ? "rgba(127,29,29,0.12)" : "#fef2f2",
                    marginBottom: 3, color: "#fca5a5", fontFamily: FONT_MONO,
                  }}>
                    {s}
                  </div>
                ))}

                {/* Flags from deal auditor */}
                {deal.flags.length > 0 && (
                  <>
                    <p style={{ fontSize: "0.625rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: "#f87171", marginTop: 12, marginBottom: 6 }}>
                      Cross-Document Discrepancies ({deal.flags.length})
                    </p>
                    {deal.flags.map((f, i) => (
                      <div key={i} style={{
                        fontSize: "0.68rem", padding: "4px 8px", borderLeft: "3px solid #f87171",
                        backgroundColor: c.isDark ? "rgba(127,29,29,0.12)" : "#fef2f2",
                        marginBottom: 3, color: "#fca5a5", fontFamily: FONT_MONO,
                      }}>{f}</div>
                    ))}
                  </>
                )}

                {/* Manual re-notify */}
                <div style={{ marginTop: 16, display: "flex", gap: 8 }}>
                  <button onClick={() => fireNotify(deal, "escalate_compliance")} style={{
                    padding: "8px 14px", borderRadius: 6, border: "none", fontSize: "0.72rem", fontWeight: 600,
                    backgroundColor: "#ef4444", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", gap: 6,
                  }}>
                    <Phone size={12} /> Escalate to Compliance
                  </button>
                  <button onClick={() => fireNotify(deal, "hold_all_parties")} style={{
                    padding: "8px 14px", borderRadius: 6, border: "1px solid #f87171", fontSize: "0.72rem", fontWeight: 500,
                    backgroundColor: "transparent", color: "#f87171", cursor: "pointer", display: "flex", alignItems: "center", gap: 6,
                  }}>
                    <Ban size={12} /> Re-notify All Parties
                  </button>
                </div>
              </div>
            </>
          ) : (
            /* NORMAL DEAL FACTS */
            <>
              <div style={{
                padding: "10px 14px", borderBottom: `1px solid ${border}`, textAlign: "center",
                backgroundColor: dealStatus === "hold" ? (c.isDark ? "rgba(127,29,29,0.15)" : "#fef2f2") : dealStatus === "ready" ? (c.isDark ? "rgba(5,46,22,0.15)" : "#f0fdf4") : panelBg,
              }}>
                <p style={{
                  fontSize: "0.6875rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em",
                  color: dealStatus === "hold" ? "#f87171" : dealStatus === "ready" ? "#4ade80" : dimText,
                }}>
                  {dealStatus === "waiting" && "Awaiting Documents"}
                  {dealStatus === "progress" && `In Progress -- ${checkedCount}/8 Complete`}
                  {dealStatus === "ready" && "Ready to Close"}
                  {dealStatus === "hold" && "Hold -- Discrepancy Detected"}
                </p>
                <p style={{ fontSize: "0.625rem", color: dimText, marginTop: 2 }}>
                  {dealStatus === "waiting" && "Submit documents to build the deal file"}
                  {dealStatus === "progress" && "Continue submitting documents"}
                  {dealStatus === "ready" && "All documents verified. No discrepancies."}
                  {dealStatus === "hold" && `${deal.flags.length} inconsistenc${deal.flags.length === 1 ? "y" : "ies"} found`}
                </p>
              </div>

              <div style={{ flex: 1, overflowY: "auto", padding: "10px 14px", fontSize: "0.72rem" }}>
                <FactGroup title="Property" c={c}>
                  <FactItem value={deal.property.address} label="" c={c} />
                  {deal.property.apn && <FactItem value={`APN: ${deal.property.apn}`} label="" c={c} />}
                </FactGroup>

                <FactGroup title="Parties" c={c}>
                  {deal.parties.buyers.length > 0
                    ? deal.parties.buyers.map((b, i) => <FactItem key={i} value={b} label="Buyer" c={c} status={deal.verifiedEntities[b]} />)
                    : <FactItem value={null} label="Buyer" c={c} />}
                  {deal.parties.sellers.length > 0
                    ? deal.parties.sellers.map((s, i) => <FactItem key={i} value={s} label="Seller" c={c} status={deal.verifiedEntities[s]} />)
                    : <FactItem value={null} label="Seller" c={c} />}
                  {deal.parties.lender && <FactItem value={deal.parties.lender} label="Lender" c={c} />}
                </FactGroup>

                <FactGroup title="Transaction" c={c}>
                  {deal.transaction.fileNumber && <FactItem value={deal.transaction.fileNumber} label="File #" c={c} />}
                  {deal.transaction.purchasePrice && <FactItem value={deal.transaction.purchasePrice} label="Price" c={c} />}
                  {deal.transaction.loanAmount && <FactItem value={deal.transaction.loanAmount} label="Loan" c={c} />}
                  {deal.transaction.cashToClose && <FactItem value={deal.transaction.cashToClose} label="Cash to Close" c={c} />}
                  {deal.transaction.closingDate && <FactItem value={deal.transaction.closingDate} label="Closing" c={c} />}
                  {!deal.transaction.fileNumber && !deal.transaction.purchasePrice && <FactItem value={null} label="" c={c} placeholder="Awaiting transaction details..." />}
                </FactGroup>

                <FactGroup title="Lender / Loan" c={c}>
                  {deal.loan.lender && <FactItem value={deal.loan.lender} label="" c={c} />}
                  {deal.loan.type && <FactItem value={deal.loan.type} label="" c={c} />}
                  {deal.loan.amount && <FactItem value={deal.loan.amount} label="Amount" c={c} />}
                  {deal.loan.rate && <FactItem value={deal.loan.rate} label="Rate" c={c} />}
                  {!deal.loan.lender && <FactItem value={null} label="" c={c} placeholder="Pending lender details..." />}
                </FactGroup>

                <FactGroup title="Closing Checklist" c={c}>
                  {MILESTONES.map(([key, label]) => (
                    <div key={key} style={{
                      fontSize: "0.68rem", padding: "3px 8px", borderLeft: `3px solid ${deal.milestones[key] ? "#4ade80" : border}`,
                      marginBottom: 3, opacity: deal.milestones[key] ? 1 : 0.4, color: c.ink,
                      fontFamily: FONT_MONO,
                    }}>
                      {deal.milestones[key] ? <Check size={10} style={{ marginRight: 4 }} /> : "  "}{label}
                    </div>
                  ))}
                </FactGroup>

                <FactGroup title="Title / Escrow" c={c}>
                  {deal.titleCompany.name && <FactItem value={deal.titleCompany.name} label="" c={c} status={deal.verifiedEntities[deal.titleCompany.name]} />}
                  {deal.titleCompany.officer && <FactItem value={deal.titleCompany.officer} label="" c={c} />}
                  {deal.titleCompany.phone && <FactItem value={deal.titleCompany.phone} label="" c={c} />}
                  {!deal.titleCompany.name && <FactItem value={null} label="" c={c} />}
                </FactGroup>

                <FactGroup title="Wire Instructions" c={c}>
                  {deal.wire.bank && <FactItem value={deal.wire.bank} label="Bank" c={c} status={deal.verifiedEntities[deal.wire.bank]} />}
                  {deal.wire.routing && <FactItem value={deal.wire.routing} label="Routing" c={c} status={deal.verifiedEntities[deal.wire.routing]} />}
                  {deal.wire.beneficiary && <FactItem value={deal.wire.beneficiary} label="Beneficiary" c={c} status={deal.verifiedEntities[deal.wire.beneficiary]} />}
                  {deal.wire.amount && <FactItem value={deal.wire.amount} label="Amount" c={c} />}
                  {!deal.wire.bank && <FactItem value={null} label="" c={c} placeholder="No wire instructions yet..." />}
                </FactGroup>

                {deal.flags.length > 0 && (
                  <FactGroup title={`Flags (${deal.flags.length})`} c={c} danger>
                    {deal.flags.map((f, i) => (
                      <div key={i} style={{
                        fontSize: "0.68rem", padding: "4px 8px", borderLeft: "3px solid #f87171",
                        backgroundColor: c.isDark ? "rgba(127,29,29,0.15)" : "#fef2f2",
                        marginBottom: 3, color: "#fca5a5", fontFamily: FONT_MONO,
                      }}>{f}</div>
                    ))}
                  </FactGroup>
                )}
              </div>
            </>
          )}

          {/* Agent counter */}
          <div style={{ padding: "10px 14px", borderTop: `1px solid ${border}`, backgroundColor: isHighRisk ? (c.isDark ? "rgba(127,29,29,0.15)" : "#fef2f2") : panelBg, display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: "1.75rem", fontWeight: 700, color: isHighRisk ? "#ef4444" : c.primary, lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>{agentCount || 15}</span>
            <span style={{ fontSize: "0.625rem", color: isHighRisk ? "#fca5a5" : dimText, textTransform: "uppercase", letterSpacing: "0.04em" }}>
              {isHighRisk ? "Agents Flagged This" : "Agents Available"}
            </span>
          </div>
        </div>

        {/* RIGHT: Agent Activity */}
        <div style={{ display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <div style={{ padding: "8px 14px", borderBottom: `1px solid ${border}`, backgroundColor: panelBg, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {running && <div style={{ width: 7, height: 7, borderRadius: "50%", backgroundColor: "#ef4444", animation: "pulse 1s infinite" }} />}
              <span style={{ fontSize: "0.6875rem", fontWeight: 500, color: dimText, textTransform: "uppercase", letterSpacing: "0.08em" }}>Agent Activity</span>
            </div>
            {events.length > 0 && <span style={{ fontSize: "0.625rem", color: dimText }}>{events.length} events</span>}
          </div>

          {/* Activity header */}
          <div style={{ padding: "6px 14px", backgroundColor: c.isDark ? "#0a0d12" : "#f8fafc", borderBottom: `1px solid ${border}`, display: "flex", alignItems: "center", gap: 6 }}>
            {running && <div style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: "#ef4444", animation: "blink 1s infinite" }} />}
            <span style={{ fontSize: "0.6875rem", fontWeight: 500, color: dimText, textTransform: "uppercase", letterSpacing: "0.08em" }}>Agent Conversation</span>
          </div>

          {/* Log */}
          <div ref={logRef} style={{
            flex: 1, overflowY: "auto", padding: "10px 14px",
            backgroundColor: c.isDark ? "#000" : "#fafbfc",
            fontFamily: FONT_MONO,
            fontSize: "0.72rem", lineHeight: 1.9,
          }}>
            {events.length === 0 && !running ? (
              <div style={{ padding: "40px 20px", textAlign: "center", color: dimText, fontSize: "0.78rem" }}>
                Click "Demo" to see 14 agents catch a BEC attack in real-time, or paste your own document and click "Analyze".
              </div>
            ) : (
              events.map((evt, i) => {
                const sc = STAGE_COLORS[evt.stage] || STAGE_COLORS.pipeline
                const isCritical = /CRITICAL|CONFIRMED|MISMATCH|ALERT|DO NOT|DISCREPANCY|flagged|compromised/i.test(evt.message)
                const msgColor = isCritical ? "#f87171" : evt.status === "complete" ? "#4ade80" : evt.status === "error" ? "#f87171" : c.ink
                return (
                  <motion.div key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }}
                    style={{ display: "flex", gap: 6, alignItems: "flex-start" }}>
                    <span style={{
                      display: "inline-block", padding: "1px 5px", borderRadius: 3,
                      fontSize: "0.6rem", fontWeight: 600, minWidth: 58, textAlign: "center",
                      backgroundColor: sc.bg, color: sc.text, flexShrink: 0, marginTop: 4,
                    }}>{sc.label}</span>
                    <span style={{ color: msgColor }}>{evt.message}</span>
                  </motion.div>
                )
              })
            )}
          </div>

          {/* Verdict */}
          <AnimatePresence>
            {verdict && rs && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{
                padding: "12px 14px", flexShrink: 0,
                borderTop: `2px solid ${isHighRisk ? "rgba(239,68,68,0.4)" : riskLevel === "MEDIUM" ? "rgba(251,191,36,0.4)" : "rgba(34,197,94,0.4)"}`,
                backgroundColor: isHighRisk ? (c.isDark ? "rgba(127,29,29,0.2)" : "#fef2f2") : riskLevel === "MEDIUM" ? (c.isDark ? "rgba(120,53,15,0.15)" : "#fffbeb") : (c.isDark ? "rgba(5,46,22,0.2)" : "#f0fdf4"),
                display: "flex", alignItems: "center", gap: 10,
              }}>
                {isHighRisk ? <AlertTriangle size={20} color="#f87171" /> : riskLevel === "MEDIUM" ? <AlertTriangle size={20} color="#fbbf24" /> : <CheckCircle size={20} color="#4ade80" />}
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: "0.875rem", fontWeight: 700, color: isHighRisk ? "#f87171" : riskLevel === "MEDIUM" ? "#fbbf24" : "#4ade80", fontVariantNumeric: "tabular-nums" }}>
                    {riskLevel} RISK -- {riskScore}/100
                  </p>
                  <p style={{ fontSize: "0.72rem", color: dimText }}>{(rs.signals || []).slice(0, 2).join(" | ")}</p>
                </div>
                <span style={{ fontSize: "0.72rem", color: dimText, fontVariantNumeric: "tabular-nums" }}>{agentCount} agents | {((pipelineInfo?.duration_ms || 0) / 1000).toFixed(1)}s</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <style>{`
        @keyframes pulse { 50% { opacity: 0.3 } }
        @keyframes blink { 50% { opacity: 0.3 } }
        .animate-spin { animation: spin 1s linear infinite }
        @keyframes spin { to { transform: rotate(360deg) } }
      `}</style>
    </div>
  )
}

function ResponseStep({ num, children, c, critical }: { num: number; children: React.ReactNode; c: any; critical?: boolean }) {
  return (
    <div style={{
      display: "flex", gap: 10, marginBottom: 10, padding: "8px 10px", borderRadius: 6,
      backgroundColor: critical ? (c.isDark ? "rgba(127,29,29,0.12)" : "#fef2f2") : (c.isDark ? "rgba(255,255,255,0.03)" : "#f8fafc"),
      border: `1px solid ${critical ? "rgba(239,68,68,0.2)" : c.hairline}`,
    }}>
      <span style={{
        width: 20, height: 20, borderRadius: "50%", flexShrink: 0,
        backgroundColor: critical ? "#ef4444" : c.isDark ? "#1e293b" : "#e2e8f0",
        color: critical ? "#fff" : c.muted,
        fontSize: "0.625rem", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center",
      }}>{num}</span>
      <p style={{ fontSize: "0.72rem", color: critical ? "#fca5a5" : c.ink, lineHeight: 1.4, fontWeight: critical ? 500 : 300 }}>
        {children}
      </p>
    </div>
  )
}

function FactGroup({ title, children, c, danger }: { title: string; children: React.ReactNode; c: any; danger?: boolean }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <p style={{ fontSize: "0.6rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: danger ? "#f87171" : c.muted, marginBottom: 4 }}>{title}</p>
      {children}
    </div>
  )
}

function FactItem({ value, label, c, status, placeholder }: { value: string | null; label: string; c: any; status?: string; placeholder?: string }) {
  const borderColor = status === "verified" ? "#4ade80" : status === "unverified" ? "#f87171" : status === "mismatch" ? "#f87171" : c.hairline
  const bg = status === "verified" ? (c.isDark ? "rgba(5,46,22,0.08)" : "transparent") : status === "unverified" ? (c.isDark ? "rgba(127,29,29,0.08)" : "transparent") : "transparent"
  const hasNumber = value ? /[\$\d]/.test(value) : false
  return (
    <div style={{
      fontSize: "0.68rem", padding: "3px 8px", borderLeft: `3px solid ${borderColor}`,
      marginBottom: 3, backgroundColor: bg, color: c.ink,
      fontFamily: FONT_MONO, fontVariantNumeric: hasNumber ? "tabular-nums" : undefined,
    }}>
      {value ? (
        <>
          {label && <span style={{ color: c.muted }}>{label}: </span>}
          {value}
          {status === "verified" && <span style={{ color: "#4ade80", fontSize: "0.55rem", fontWeight: 600, marginLeft: 6 }}>VERIFIED</span>}
          {status === "unverified" && <span style={{ color: "#f87171", fontSize: "0.55rem", fontWeight: 600, marginLeft: 6 }}>UNVERIFIED</span>}
          {status === "mismatch" && <span style={{ color: "#fca5a5", fontSize: "0.55rem", fontWeight: 600, marginLeft: 6 }}>MISMATCH</span>}
        </>
      ) : (
        <span style={{ opacity: 0.3 }}>{placeholder || "Pending..."}</span>
      )}
    </div>
  )
}
