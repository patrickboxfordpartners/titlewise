import { McpAgent } from "agents/mcp";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { verifyICToken } from "./auth";
import { getCotalManifest } from "./cotal";
import { MitosisMemory, adversarialVerify, propertyFingerprint } from "./mitosis";
import { executeAnalyzeCommitment } from "./tools/analyze-commitment";
import { executeVerifyWire } from "./tools/verify-wire";
import { executeAnalyzeCD } from "./tools/analyze-cd";
import { executeReviewHOA } from "./tools/review-hoa";
import { runPipeline, runMultiPipeline, detectDocumentTypes } from "./pipeline";
import { handleNotification, NotifyRequest } from "./notifications";
import { getPricing, getQuote, validateReceipt, build402Response, createCheckoutSession, createSubscriptionSession, retrieveCheckoutSession } from "./payments";

export interface Env {
  TITLEWISE_API_URL: string;
  ANTHROPIC_API_KEY: string;
  MITOSIS_API_KEY: string;
  MITOSIS_OFFICE_ID: string;
  TAVILY_API_KEY: string;
  HACKATHON_MODE: string;
  HACK_SECRET: string;
  TELNYX_API_KEY: string;
  TELNYX_PHONE_NUMBER: string;
  TELNYX_MESSAGING_PROFILE_ID: string;
  TELNYX_CALL_CONTROL_APP_ID: string;
  DEMO_NOTIFY_PHONE: string;
  STRIPE_SECRET_KEY: string;
  DOCS_BUCKET?: R2Bucket;
}

const LLMS_TXT = `# TitleWise Agent Gateway
> Real estate document intelligence as agent-native tools. Analyze title commitments, verify wire instructions, review closing disclosures, and audit HOA documents — all via MCP.

## Capabilities
This service exposes four tools via the Model Context Protocol (MCP):

1. **analyze_commitment** — Parse title commitments, extract requirements/exceptions, flag red flags
2. **verify_wire** — Detect wire fraud indicators in transfer instructions
3. **analyze_closing_disclosure** — TRID compliance review of Closing Disclosures
4. **review_hoa** — Extract fees, restrictions, and transfer requirements from HOA docs

## Authentication
Authenticate with an Immersive Commons agent token:
- Scopes required: \`titlewise:analyze\` or \`hack:*\` (hackathon mode)
- Pass as: \`Authorization: Bearer <ic_token>\`

## MCP Endpoint
Connect your MCP client to: \`/sse\`

## Transaction Model
Each tool call is a complete transaction:
- Input: document text (plain text extracted from PDF)
- Output: structured JSON with findings, risk flags, and recommendations
- Stateless: no session required between calls

## About
TitleWise is a production SaaS platform serving real estate closing attorneys.
This agent gateway exposes its document intelligence to any MCP-compatible agent.
Built by Boxford Partners. https://titlewise.app
`;

const TOOL_NAMES = [
  "analyze_commitment",
  "verify_wire",
  "analyze_closing_disclosure",
  "review_hoa",
  "recall",
];

export class TitleWiseAgent extends McpAgent<Env, {}, {}> {
  server = new McpServer({
    name: "TitleWise",
    version: "1.0.0",
  });

  private getMemory(): MitosisMemory | null {
    if (!this.env.MITOSIS_API_KEY || !this.env.MITOSIS_OFFICE_ID) return null;
    return new MitosisMemory({
      apiKey: this.env.MITOSIS_API_KEY,
      officeId: this.env.MITOSIS_OFFICE_ID,
    });
  }

  async init() {
    this.server.tool(
      "analyze_commitment",
      "Analyze a title commitment document. Extracts property details, requirements, exceptions, and red flags. Results are stored in persistent memory for future reference.",
      {
        document_text: z.string().min(100).describe("Full text of the title commitment document"),
        property_address: z.string().optional().describe("Property address for cross-reference"),
      },
      async (args) => {
        const memory = this.getMemory();
        const fingerprint = propertyFingerprint(args.property_address, args.document_text);

        // Check memory for prior analysis
        if (memory) {
          const prior = await memory.queryPriorAnalyses(
            `title commitment analysis for ${args.property_address || "property"}`,
            "commitment"
          );
          if (prior?.results?.length && prior.results[0].score > 0.9) {
            return { content: [{ type: "text" as const, text: JSON.stringify({
              source: "memory",
              note: "Prior analysis found in agent memory",
              prior_analysis: prior.results[0].preview,
              id: prior.results[0].universal_id,
            }, null, 2) }] };
          }
        }

        const result = await executeAnalyzeCommitment(args, this.env.TITLEWISE_API_URL, this.env.ANTHROPIC_API_KEY);

        // Store in memory
        if (memory && (result as any).analysis) {
          await memory.storeAnalysis(
            "commitment",
            fingerprint,
            `Title Commitment: ${args.property_address || "Unknown property"}`,
            JSON.stringify((result as any).analysis),
            { type: "commitment", property: args.property_address || "" }
          );
        }

        return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
      }
    );

    this.server.tool(
      "verify_wire",
      "Verify wire transfer instructions for fraud indicators. Uses adversarial verification — a second independent agent cross-checks all findings. Results persist in memory for cross-matter fraud detection.",
      {
        document_text: z.string().min(50).describe("Full text of wire transfer instructions"),
        expected_amount: z.number().optional().describe("Expected wire amount in dollars"),
        expected_beneficiary: z.string().optional().describe("Expected beneficiary name"),
      },
      async (args) => {
        const memory = this.getMemory();

        const result = await executeVerifyWire(args, this.env.TITLEWISE_API_URL, this.env.ANTHROPIC_API_KEY);
        const analysis = (result as any).analysis;

        // Adversarial verification for wire fraud (always — this is safety-critical)
        let verification = null;
        if (analysis && this.env.ANTHROPIC_API_KEY) {
          verification = await adversarialVerify(analysis, args.document_text, this.env.ANTHROPIC_API_KEY);
        }

        // Store in memory for cross-matter pattern detection
        if (memory && analysis) {
          const fingerprint = propertyFingerprint(undefined, args.document_text);
          await memory.storeAnalysis(
            "wire",
            fingerprint,
            `Wire Instructions: ${analysis.beneficiary?.name || "Unknown"}`,
            JSON.stringify({ analysis, verification }),
            { type: "wire", beneficiary: analysis.beneficiary?.name || "" }
          );
        }

        return { content: [{ type: "text" as const, text: JSON.stringify({
          ...result,
          adversarial_verification: verification,
        }, null, 2) }] };
      }
    );

    this.server.tool(
      "analyze_closing_disclosure",
      "Review a Closing Disclosure for TRID compliance, fee accuracy, and discrepancies. Results stored in persistent memory.",
      {
        document_text: z.string().min(100).describe("Full text of the Closing Disclosure document"),
        property_address: z.string().optional().describe("Property address for context"),
      },
      async (args) => {
        const memory = this.getMemory();

        const result = await executeAnalyzeCD(args, this.env.TITLEWISE_API_URL, this.env.ANTHROPIC_API_KEY);

        if (memory && (result as any).analysis) {
          const fingerprint = propertyFingerprint(args.property_address, args.document_text);
          await memory.storeAnalysis(
            "cd",
            fingerprint,
            `Closing Disclosure: ${args.property_address || "Unknown property"}`,
            JSON.stringify((result as any).analysis),
            { type: "cd", property: args.property_address || "" }
          );
        }

        return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
      }
    );

    this.server.tool(
      "review_hoa",
      "Review HOA documents. Extracts fees, assessments, restrictions, and transfer requirements. Results stored in persistent memory.",
      {
        document_text: z.string().min(100).describe("Full text of HOA documents"),
      },
      async (args) => {
        const memory = this.getMemory();

        const result = await executeReviewHOA(args, this.env.TITLEWISE_API_URL, this.env.ANTHROPIC_API_KEY);

        if (memory && (result as any).analysis) {
          await memory.storeAnalysis(
            "hoa",
            `hoa:${Date.now()}`,
            `HOA Review: ${(result as any).analysis?.association?.name || "Unknown HOA"}`,
            JSON.stringify((result as any).analysis),
            { type: "hoa" }
          );
        }

        return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
      }
    );

    // Meta-tool: query prior analyses across all feeds
    this.server.tool(
      "recall",
      "Search TitleWise's persistent memory for prior analyses. Use to check if a property was previously analyzed, find patterns across matters, or retrieve historical findings.",
      {
        query: z.string().describe("What to search for (e.g., property address, beneficiary name, HOA name)"),
        feed: z.string().optional().describe("Narrow to a specific feed: commitment, wire, cd, or hoa"),
      },
      async (args) => {
        const memory = this.getMemory();
        if (!memory) {
          return { content: [{ type: "text" as const, text: JSON.stringify({ error: "Memory not configured" }) }] };
        }

        const results = await memory.queryPriorAnalyses(args.query, args.feed);
        return { content: [{ type: "text" as const, text: JSON.stringify(results, null, 2) }] };
      }
    );
  }
}

function landingPageHTML(baseUrl: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>TitleWise — AI Closing Platform for Real Estate Attorneys</title>
<meta name="description" content="From intake to clear-to-close. AI tools for title analysis, CD review, wire fraud prevention, and status updates. Built for real estate closing attorneys.">
<link rel="icon" type="image/svg+xml" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 36 43'%3E%3Crect x='10' y='0' width='24' height='32' rx='4' fill='%23ffffff59'/%3E%3Crect x='2' y='8' width='24' height='32' rx='4' fill='%232563EB'/%3E%3C/svg%3E">
<style>
*{margin:0;padding:0;box-sizing:border-box}
:root{--bg:#111827;--text:#EDEEF0;--muted:rgba(237,238,240,0.5);--dim:rgba(237,238,240,0.22);--rule:rgba(237,238,240,0.07);--blue:#3b82f6;--alt:rgba(237,238,240,0.025);--nav-bg:#111827f0;--logo-back:rgba(255,255,255,0.35);--logo-front:#2563EB}
[data-theme="light"]{--bg:#f8fafc;--text:#0f172a;--muted:#64748b;--dim:#94a3b8;--rule:rgba(15,23,42,0.08);--blue:#2563eb;--alt:rgba(15,23,42,0.025);--nav-bg:rgba(248,250,252,0.92);--logo-back:rgba(15,23,42,0.12);--logo-front:#2563EB}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:var(--bg);color:var(--text);min-height:100vh;-webkit-font-smoothing:antialiased;transition:background 0.2s,color 0.2s}

nav{position:sticky;top:0;z-index:100;background:var(--nav-bg);backdrop-filter:blur(12px);border-bottom:1px solid var(--rule);padding:0 40px;height:64px;display:flex;align-items:center;justify-content:space-between}
nav a.logo{text-decoration:none;display:flex;align-items:center;gap:10px}
nav .nav-right{display:flex;align-items:center;gap:24px}
nav .nav-right a{font-size:0.875rem;color:var(--muted);text-decoration:none;transition:color 0.15s}
nav .nav-right a:hover{color:var(--text)}
.nav-cta{font-size:0.875rem;font-weight:600;color:#fff !important;background:var(--blue);border-radius:8px;padding:8px 18px;white-space:nowrap;transition:all 0.2s}
.nav-cta:hover{background:#1d4ed8;transform:translateY(-1px)}
.theme-toggle{display:flex;border:1px solid var(--rule);border-radius:8px;overflow:hidden}
.theme-toggle button{background:transparent;border:none;padding:7px 10px;color:var(--muted);cursor:pointer;transition:all 0.15s;display:flex;align-items:center}
.theme-toggle button.active{background:var(--blue);color:#fff}
.theme-toggle button svg{width:14px;height:14px;fill:currentColor}
@media(max-width:640px){nav .tw-nav-link{display:none !important}}

.hero-wrap{position:relative;overflow:hidden}
.hero-video{position:absolute;top:0;left:0;width:100%;height:100%;object-fit:cover;opacity:0.15;pointer-events:none;z-index:0}
[data-theme="light"] .hero-video{opacity:0.1}
.hero-bg{position:absolute;top:0;left:0;width:100%;height:100%;z-index:0;pointer-events:none;background:radial-gradient(ellipse 80% 60% at 70% 40%,rgba(59,130,246,0.08) 0%,transparent 60%),radial-gradient(ellipse 60% 50% at 20% 80%,rgba(139,92,246,0.06) 0%,transparent 50%);animation:heroBgShift 20s ease-in-out infinite alternate}
[data-theme="light"] .hero-bg{background:radial-gradient(ellipse 80% 60% at 70% 40%,rgba(59,130,246,0.05) 0%,transparent 60%),radial-gradient(ellipse 60% 50% at 20% 80%,rgba(139,92,246,0.04) 0%,transparent 50%)}
@keyframes heroBgShift{0%{transform:scale(1) translate(0,0)}100%{transform:scale(1.05) translate(-2%,3%)}}
.hero-overlay{position:absolute;top:0;left:0;width:100%;height:100%;background:linear-gradient(180deg,var(--bg) 0%,transparent 25%,transparent 75%,var(--bg) 100%);z-index:1;pointer-events:none}
.hero{position:relative;z-index:2;padding:96px 32px 80px;max-width:1060px;margin:0 auto}
.hero .eyebrow{font-size:0.75rem;font-weight:700;color:var(--blue);letter-spacing:0.08em;text-transform:uppercase;margin-bottom:24px}
.hero h1{font-size:clamp(2.75rem,6vw,4.5rem);font-weight:800;letter-spacing:-0.04em;line-height:1.0;color:var(--text);max-width:700px;margin-bottom:28px}
.hero h1 span{color:var(--blue)}
.hero .sub{font-size:1.0625rem;color:var(--muted);line-height:1.7;max-width:520px;margin-bottom:40px}
.hero .ctas{display:flex;gap:12px;flex-wrap:wrap}
.btn-primary{display:inline-flex;align-items:center;background:var(--blue);color:#fff;font-size:0.9375rem;font-weight:600;padding:12px 28px;border-radius:8px;text-decoration:none;transition:all 0.2s}
.btn-primary:hover{background:#1d4ed8;transform:translateY(-1px);box-shadow:0 4px 12px rgba(59,130,246,0.3)}
.btn-secondary{display:inline-flex;align-items:center;background:transparent;border:1px solid var(--rule);color:var(--muted);font-size:0.9375rem;padding:12px 28px;border-radius:8px;text-decoration:none;transition:all 0.2s}
.btn-secondary:hover{border-color:var(--blue);color:var(--text)}
.hero .note{font-size:0.8125rem;color:var(--dim);margin-top:16px}

.live-demo-section{border-top:1px solid var(--rule);padding:80px 32px;background:var(--bg)}
.live-demo-inner{max-width:800px;margin:0 auto}
.live-demo-inner h2{font-size:clamp(1.5rem,3vw,2rem);font-weight:800;letter-spacing:-0.03em;color:var(--text);margin-bottom:8px}
.live-demo-inner .sub{font-size:0.9rem;color:var(--muted);margin-bottom:32px}
.demo-card{border:1px solid var(--rule);border-radius:12px;overflow:hidden;background:#0a0a0f}
[data-theme="light"] .demo-card{background:#fff;border-color:#e2e8f0}
.demo-card-header{display:flex;align-items:center;justify-content:space-between;padding:16px 20px;border-bottom:1px solid var(--rule);background:#111827}
[data-theme="light"] .demo-card-header{background:#f8fafc}
.demo-card-header .demo-title{font-size:0.8rem;font-weight:600;color:var(--muted);text-transform:uppercase;letter-spacing:0.05em}
.demo-card-btns{display:flex;gap:8px}
.demo-run-btn{padding:8px 20px;border-radius:6px;border:none;font-size:0.8rem;font-weight:600;cursor:pointer;transition:all 0.2s}
.demo-run-btn.primary{background:#8b5cf6;color:#fff}
.demo-run-btn.primary:hover{background:#7c3aed;transform:translateY(-1px)}
.demo-run-btn.secondary{background:transparent;border:1px solid var(--rule);color:var(--muted)}
.demo-run-btn.secondary:hover{border-color:var(--blue);color:var(--text)}
.demo-run-btn:disabled{opacity:0.5;cursor:not-allowed;transform:none}
.demo-log{height:320px;overflow-y:auto;padding:16px 20px;font-family:'SF Mono',Monaco,'Cascadia Code',monospace;font-size:0.75rem;line-height:2}
.demo-log .dl-line{opacity:0;animation:dlFadeIn 0.3s forwards}
@keyframes dlFadeIn{to{opacity:1}}
.dl-line .dl-tag{display:inline-block;padding:2px 6px;border-radius:3px;font-size:0.65rem;font-weight:600;margin-right:8px;min-width:56px;text-align:center}
.dl-tag.t-extract{background:#164e63;color:#67e8f9}
.dl-tag.t-memory{background:#052e16;color:#86efac}
.dl-tag.t-analysis{background:#3b0764;color:#d8b4fe}
.dl-tag.t-tavily{background:#422006;color:#fbbf24}
.dl-tag.t-adversarial{background:#7f1d1d;color:#fca5a5}
.dl-tag.t-synthesis{background:#1e1b4b;color:#a5b4fc}
.dl-tag.t-alert{background:#7f1d1d;color:#fca5a5}
.dl-tag.t-pipeline{background:#1e293b;color:#94a3b8}
.dl-tag.t-audit{background:#312e81;color:#a5b4fc}
.dl-tag.t-records{background:#1c1917;color:#d6d3d1}
.dl-msg{color:var(--text)}
.dl-msg.dim{color:var(--muted)}
.dl-msg.success{color:#4ade80}
.dl-msg.danger{color:#f87171}
.demo-verdict{padding:16px 20px;border-top:1px solid var(--rule);display:none;align-items:center;gap:12px}
.demo-verdict.visible{display:flex}
.demo-verdict.safe{background:#052e1620;border-top-color:#16a34a40}
.demo-verdict.danger{background:#7f1d1d20;border-top-color:#991b1b80}
.demo-verdict .dv-label{font-size:0.9rem;font-weight:700}
.demo-verdict.safe .dv-label{color:#4ade80}
.demo-verdict.danger .dv-label{color:#f87171}
.demo-verdict .dv-sub{font-size:0.8rem;color:var(--muted)}
.demo-fulllink{text-align:center;padding:16px;border-top:1px solid var(--rule)}
.demo-fulllink a{font-size:0.8rem;color:var(--blue);text-decoration:none}
.demo-fulllink a:hover{text-decoration:underline}
.stats{border-top:1px solid var(--rule);padding:64px 32px}
[data-theme="light"] .stats{background:#e2e8f0 !important}
.stats-inner{max-width:1060px;margin:0 auto;display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:48px 64px}
.stats-inner .val{font-size:3.5rem;font-weight:800;letter-spacing:-0.04em;line-height:1;margin-bottom:8px}
.stats-inner .val.red{color:#ef4444}
.stats-inner .val.blue{color:var(--blue)}
.stats-inner .val.amber{color:#f59e0b}
.stats-inner .lbl{font-size:0.875rem;font-weight:600;color:var(--blue);margin-bottom:10px}
.stats-inner .bod{font-size:0.9rem;color:var(--muted);line-height:1.6}

section{border-top:1px solid var(--rule);padding:80px 32px}
section.alt{background:#1a2332}
section.dark-blue{background:#0f1b2d}
section.grey{background:#1f2937}
[data-theme="light"] section.alt{background:#f1f5f9}
[data-theme="light"] section.dark-blue{background:#e8eef6}
[data-theme="light"] section.grey{background:#f8fafc}
.sec-inner{max-width:1060px;margin:0 auto}
section h2{font-size:clamp(1.5rem,3vw,2rem);font-weight:800;letter-spacing:-0.03em;color:var(--text);margin-bottom:12px}
section .sub{font-size:0.9rem;color:var(--muted);max-width:480px}

.how-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:48px 64px;margin-top:56px}
.how-grid>div{padding:24px;border:1px solid var(--rule);border-radius:10px;transition:border-color 0.2s,transform 0.2s}
.how-grid>div:hover{border-color:rgba(59,130,246,0.2);transform:translateY(-2px)}
.how-grid .step-n{font-size:0.75rem;font-weight:700;color:var(--blue);margin-bottom:14px;letter-spacing:0.05em}
.how-grid h3{font-size:1.0625rem;font-weight:700;color:var(--text);margin-bottom:12px;line-height:1.3}
.how-grid p{font-size:0.9rem;color:var(--muted);line-height:1.65}

.features-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:0 48px;margin-top:48px}
.features-grid .feat{padding:18px 0;border-top:1px solid var(--rule);transition:padding-left 0.2s}
.features-grid .feat:hover{padding-left:12px;border-top-color:var(--blue)}
.features-grid .feat h3{font-size:0.9rem;font-weight:600;color:var(--text);margin-bottom:4px}
.features-grid .feat p{font-size:0.8125rem;color:var(--muted)}

.pricing-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-top:32px}
.pricing-grid .card{border:1px solid var(--rule);border-radius:10px;padding:28px 24px;text-decoration:none;display:flex;flex-direction:column;transition:all 0.2s}
.pricing-grid .card.hl{background:rgba(59,130,246,0.08);border-color:rgba(59,130,246,0.25)}
.pricing-grid .card:hover{border-color:rgba(59,130,246,0.25);transform:translateY(-3px);box-shadow:0 8px 24px rgba(0,0,0,0.15)}
.pricing-grid .card .name{font-size:0.8125rem;color:var(--muted);margin-bottom:10px;font-weight:500}
.pricing-grid .card .price{font-size:2rem;font-weight:800;color:var(--text);letter-spacing:-0.03em;line-height:1;margin-bottom:12px}
.pricing-grid .card .price span{font-size:0.875rem;font-weight:400;color:var(--muted)}
.pricing-grid .card .info{font-size:0.8125rem;color:var(--dim);line-height:1.5}
.pricing-grid .card .feat-list{list-style:none;padding:0;margin:16px 0;text-align:left;flex:1}
.pricing-grid .card .feat-list li{font-size:0.8125rem;color:var(--muted);padding:4px 0;border-top:1px solid var(--rule)}
.pricing-grid .card .feat-list li::before{content:"\\2713 ";color:#4ade80;font-weight:700}
.pricing-btn{display:block;width:100%;text-align:center;padding:10px 20px;background:#2563eb;color:#fff !important;border-radius:6px;text-decoration:none !important;font-size:0.8125rem;font-weight:600;transition:background 0.2s;margin-top:auto}
.pricing-btn:hover{background:#1d4ed8;color:#fff !important}
@media(max-width:900px){.pricing-grid{grid-template-columns:repeat(2,1fr)}}
@media(max-width:520px){.pricing-grid{grid-template-columns:1fr}}

.faq-section{border-top:1px solid var(--rule);padding:80px 32px}
.faq-inner{max-width:720px;margin:0 auto}
.faq-item{border-bottom:1px solid var(--rule)}
.faq-q{display:flex;align-items:center;justify-content:space-between;padding:20px 0;cursor:pointer;gap:16px}
.faq-q h3{font-size:0.9375rem;font-weight:600;color:var(--text);line-height:1.4}
.faq-q .arrow{color:var(--muted);font-size:1.25rem;transition:transform 0.2s;flex-shrink:0}
.faq-item.open .faq-q .arrow{transform:rotate(45deg);color:var(--blue)}
.faq-a{max-height:0;overflow:hidden;transition:max-height 0.3s ease,padding 0.3s ease}
.faq-item.open .faq-a{max-height:300px;padding-bottom:20px}
.faq-a p{font-size:0.875rem;color:var(--muted);line-height:1.7}

.cta-section{border-top:1px solid var(--rule);padding:96px 32px;text-align:center}
.cta-section h2{font-size:clamp(1.75rem,4vw,2.5rem);font-weight:800;letter-spacing:-0.03em;color:var(--text);margin-bottom:16px;line-height:1.1}
.cta-section p{font-size:0.9375rem;color:var(--muted);margin-bottom:36px;line-height:1.7}
.cta-section .ctas{display:flex;gap:12px;justify-content:center;flex-wrap:wrap}

#cookie-banner{position:fixed;bottom:0;left:0;right:0;z-index:9999;background:var(--card);border-top:1px solid var(--rule);padding:16px 24px;box-shadow:0 -4px 20px rgba(0,0,0,0.15)}
.cb-inner{max-width:960px;margin:0 auto;display:flex;align-items:center;justify-content:space-between;gap:16px;flex-wrap:wrap}
.cb-inner p{font-size:0.8125rem;color:var(--muted);margin:0;line-height:1.5}
.cb-inner a{color:var(--blue);text-decoration:none}
.cb-btns{display:flex;gap:8px;flex-shrink:0}
.cb-btns button{padding:8px 16px;border-radius:6px;font-size:0.8125rem;font-weight:600;cursor:pointer;border:none;transition:background 0.2s}
.cb-btns button:first-child{background:#2563eb;color:#fff}
.cb-btns button:first-child:hover{background:#1d4ed8}
.cb-btns button:last-child{background:transparent;color:var(--muted);border:1px solid var(--rule)}
.cb-btns button:last-child:hover{border-color:var(--muted)}

footer{border-top:1px solid var(--rule);background:var(--bg)}
.footer-inner{max-width:1060px;margin:0 auto;padding:56px 32px 0}
.footer-grid{display:grid;grid-template-columns:2fr 1fr 1fr 1fr;gap:0 48px}
@media(max-width:768px){.footer-grid{grid-template-columns:1fr 1fr !important;row-gap:32px !important}}
@media(max-width:480px){.footer-grid{grid-template-columns:1fr !important;text-align:center}.footer-grid ul{align-items:center}.footer-brand{justify-content:center}}
.footer-brand{display:flex;align-items:center;gap:8px}
.footer-desc{margin-top:16px;font-size:0.875rem;color:var(--muted);line-height:1.65;max-width:280px}
.footer-badge{display:inline-flex;align-items:center;gap:7px;margin-top:20px;padding:5px 10px 5px 8px;border:1px solid var(--rule);border-radius:6px;text-decoration:none;background:var(--alt)}
.footer-badge .dot{width:6px;height:6px;border-radius:50%;background:var(--blue);flex-shrink:0}
.footer-badge .txt{font-size:0.65rem;color:var(--dim);text-transform:uppercase;letter-spacing:0.06em;font-weight:600}
.footer-col-title{font-size:0.6875rem;font-weight:600;letter-spacing:0.07em;text-transform:uppercase;color:var(--dim);margin-bottom:16px}
.footer-col ul{list-style:none;padding:0;display:flex;flex-direction:column;gap:12px}
.footer-col ul a{font-size:0.875rem;color:var(--muted);text-decoration:none}
.footer-col ul a:hover{color:var(--text)}
.footer-bottom{border-top:1px solid var(--rule);margin-top:40px;padding:20px 0 24px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:16px}
.footer-bottom p{font-size:0.75rem;color:var(--dim);margin:0}

@media(max-width:768px){
  nav{padding:0 20px;height:56px}
  .hero{padding:72px 24px 56px}
  .hero h1{font-size:clamp(2rem,8vw,3rem)}
  .hero .sub{font-size:1rem}
  section{padding:56px 24px}
  .stats{padding:48px 24px}
  .stats-inner{gap:40px;grid-template-columns:1fr}
  .stats-inner .val{font-size:2.75rem}
  .how-grid{gap:36px;grid-template-columns:1fr;margin-top:40px}
  .features-grid{grid-template-columns:1fr;margin-top:32px}
  .pricing-grid{grid-template-columns:1fr 1fr;gap:12px}
  .cta-section{padding:64px 24px}
  .cta-section h2{font-size:clamp(1.5rem,6vw,2rem)}
  .footer-inner{padding:40px 24px 0}
}
@media(max-width:480px){
  nav{padding:0 16px;gap:8px}
  nav .nav-right{gap:10px}
  .theme-toggle button{padding:5px 8px}
  .nav-cta{padding:6px 12px;font-size:0.8rem}
  .live-demo-section{padding:48px 16px}
  .demo-card-header{flex-direction:column;gap:12px;align-items:flex-start}
  .demo-log{height:260px;font-size:0.7rem}
  .hero{padding:56px 16px 48px}
  .hero h1{font-size:2rem;letter-spacing:-0.03em}
  .hero .sub{font-size:0.9375rem}
  .hero .ctas{flex-direction:column;gap:10px}
  .btn-primary,.btn-secondary{justify-content:center;padding:14px 24px;font-size:1rem;width:100%}
  section{padding:48px 16px}
  .stats{padding:40px 16px}
  .stats-inner .val{font-size:2.5rem}
  .stats-inner .bod{font-size:0.85rem}
  .how-grid h3{font-size:1rem}
  .how-grid p{font-size:0.85rem}
  .pricing-grid{grid-template-columns:1fr}
  .pricing-grid .card{padding:24px 20px}
  .cta-section{padding:56px 16px}
  .cta-section .ctas{flex-direction:column}
  .cta-section .ctas a{width:100%;justify-content:center}
  .footer-inner{padding:32px 16px 0}
}
</style>
</head>
<body>

<nav>
  <a class="logo" href="/">
    <svg height="28" viewBox="0 0 36 43" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="10" y="0" width="24" height="32" rx="4" fill="var(--logo-back)"/>
      <rect x="2" y="8" width="24" height="32" rx="4" fill="var(--logo-front)"/>
    </svg>
    <span style="font-size:1.125rem;line-height:1"><b style="font-weight:700;color:var(--text);letter-spacing:-0.01em">TITLE</b><span style="font-weight:300;color:var(--muted)">wise</span></span>
  </a>
  <div class="nav-right">
    <a href="/pricing" class="tw-nav-link">Pricing</a>
    <a href="/demo" class="tw-nav-link">Demo</a>
    <a href="/login" class="tw-nav-link">Log in</a>
    <div class="theme-toggle">
      <button id="btn-dark" class="active" onclick="setTheme('dark')" aria-label="Dark mode"><svg viewBox="0 0 24 24"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg></button>
      <button id="btn-light" onclick="setTheme('light')" aria-label="Light mode"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" stroke="currentColor" stroke-width="2" stroke-linecap="round" fill="none"/></svg></button>
    </div>
    <a href="/pricing" class="nav-cta">Get Started</a>
  </div>
</nav>

<div class="hero-wrap">
  <div class="hero-bg"></div>
  <video class="hero-video" autoplay muted loop playsinline id="heroVideo">
    <source src="https://cdn.pixabay.com/video/2020/08/03/46284-446732347_large.mp4" type="video/mp4">
  </video>
  <div class="hero-overlay"></div>
  <div class="hero">
    <p class="eyebrow">AI Closing Platform</p>
    <h1>30 minutes back.<br><span>Every file.</span></h1>
    <p class="sub">The analysis layer for real estate closings. Title commitments parsed in seconds. Wire fraud caught before funds move. TRID checks automated. Sits on top of your existing workflow — Qualia, SoftPro, ResWare, whatever you run.</p>
    <div class="ctas">
      <a href="#live-demo" class="btn-primary">See it work</a>
      <a href="#problem" class="btn-secondary">Why this matters</a>
    </div>
    <p class="note">Plans from $149/mo &middot; No setup fees &middot; Cancel anytime</p>
  </div>
</div>

<div class="live-demo-section" id="live-demo">
  <div class="live-demo-inner">
    <h2>Watch it catch wire fraud in real-time.</h2>
    <p class="sub">14 AI agents analyze a fraudulent wire instruction in seconds. No API keys needed — this is a recorded run.</p>
    <div class="demo-card">
      <div class="demo-card-header">
        <span class="demo-title">Agent Activity</span>
        <div class="demo-card-btns">
          <button class="demo-run-btn primary" id="inlineDemoBtn">Run fraud demo</button>
          <button class="demo-run-btn secondary" id="inlineSafeBtn">Run safe wire</button>
        </div>
      </div>
      <div class="demo-log" id="inlineDemoLog">
        <div class="dl-line"><span class="dl-msg dim">Click "Run fraud demo" to see 14 agents catch a BEC attack in real-time.</span></div>
      </div>
      <div class="demo-verdict" id="inlineDemoVerdict"></div>
      <div class="demo-fulllink"><a href="/demo">Open full analysis workspace &rarr;</a></div>
    </div>
  </div>
</div>

<div class="stats" style="background:#1f2937">
  <div class="stats-inner">
    <div>
      <p class="val red">$275M</p>
      <p class="lbl">lost to real estate fraud (FBI IC3)</p>
      <p class="bod">12,368 reported incidents. Wire fraud via business email compromise is the primary vector — fraudsters spoof settlement agent emails to redirect closing funds.</p>
    </div>
    <div>
      <p class="val amber">&lt;10%</p>
      <p class="lbl">of title firms have integrated AI workflows</p>
      <p class="bod">90% of escrow officers use consumer AI tools daily. But fewer than 10% of firms have end-to-end automation in their core stack. The gap is structural.</p>
    </div>
    <div>
      <p class="val blue">~3,100</p>
      <p class="lbl">U.S. counties, each with different rules</p>
      <p class="bod">Hundreds still require paper filings and wet ink. Technology can only move as fast as the local registry office allows. TitleWise works within that reality.</p>
    </div>
  </div>
</div>

<section id="problem" class="dark-blue">
  <div class="sec-inner">
    <h2>The industry is stuck. Not for lack of will.</h2>
    <p class="sub">Title companies operate in a multi-party chain: buyer, seller, agents, lender, title insurer, county clerk. Even fully digitized agencies can't force eClosings when lenders won't accept them.</p>
    <div class="how-grid">
      <div>
        <p class="step-n">THE BOTTLENECK</p>
        <h3>Lender &amp; registry resistance</h3>
        <p>Fully digital closings account for only 2.5%–10% of transactions. Over 80% of title agents cite lack of lender acceptance as the primary obstacle. The secondary mortgage market hasn't standardized.</p>
      </div>
      <div>
        <p class="step-n">THE LIABILITY</p>
        <h3>Risk elimination, not assumption</h3>
        <p>Title insurance is a risk-elimination product. Underwriters and attorneys prioritize legal defensibility over speed. A digital error that compromises a deed transfer creates immense financial liability.</p>
      </div>
      <div>
        <p class="step-n">THE OPPORTUNITY</p>
        <h3>Bottom-up adoption is already happening</h3>
        <p>Individual officers are rapidly adopting AI for daily tasks — drafting emails, summarizing deeds. What's missing is a purpose-built tool that respects the compliance constraints they operate under.</p>
      </div>
    </div>
  </div>
</section>

<section class="grey">
  <div class="sec-inner">
    <h2>Analysis layer, not a platform replacement.</h2>
    <p class="sub">TitleWise handles targeted micro-workflows. Your production system stays in place.</p>
    <div class="features-grid">
      <div class="feat"><h3>Title Commitment Analysis</h3><p>Exceptions, requirements, liens, easements, and red flags — 60 pages parsed in under 30 seconds</p></div>
      <div class="feat"><h3>Wire Fraud Protection</h3><p>Cross-matter verification against prior closings. Flags routing changes, lookalike domains, and late-stage instruction swaps</p></div>
      <div class="feat"><h3>CD Reviewer</h3><p>TRID tolerance checks against federal limits. Math verification. Cross-reference against commitment and loan estimate</p></div>
      <div class="feat"><h3>HOA Document Review</h3><p>Monthly dues, special assessments, transfer fees, reserve health, rental and pet restrictions surfaced automatically</p></div>
      <div class="feat"><h3>Fee Estimate Tool</h3><p>Accurate closing cost breakdowns — buyer costs (2%–5% of purchase price), seller costs (6%–10%), by transaction type</p></div>
      <div class="feat"><h3>Status Update Generator</h3><p>AI drafts updates from checklist state. Addresses the constant back-and-forth between lenders, agents, and buyers</p></div>
      <div class="feat"><h3>Tax Proration Calculator</h3><p>Prorated taxes with settlement statement formatting</p></div>
      <div class="feat"><h3>Deal Memory</h3><p>Every analysis persisted. Same bad routing number in a different matter? Flagged immediately across your entire history</p></div>
      <div class="feat"><h3>Human-in-the-Loop</h3><p>Structural pattern matching — missing fields, exceptions, inconsistencies. Legal interpretation stays with the attorney</p></div>
    </div>
  </div>
</section>

<section class="dark-blue">
  <div class="sec-inner">
    <h2>Why attorneys trust it.</h2>
    <div class="how-grid">
      <div>
        <p class="step-n">NARROW SCOPE</p>
        <h3>High-impact, not high-risk</h3>
        <p>Parses title commitments, runs TRID checks, reviews CDs, calculates prorations. Doesn't touch deed transfers, doesn't sign anything, doesn't make legal determinations.</p>
      </div>
      <div>
        <p class="step-n">INTEGRATED DEFENSE</p>
        <h3>Wire fraud as a workflow step</h3>
        <p>Cross-checks routing and account details against past closings. Flags late-stage wiring changes and lookalike domains within the matter workspace — not as a separate security product.</p>
      </div>
      <div>
        <p class="step-n">YOUR STACK</p>
        <h3>Works with what you have</h3>
        <p>Not replacing Qualia, SoftPro, or ResWare. Sits on top as a specialized analysis and automation layer. MCP-native — any agent can discover, authenticate, and run analyses.</p>
      </div>
    </div>
  </div>
</section>

<section class="grey" id="pricing">
  <div class="sec-inner">
    <h2>Simple pricing. No surprises.</h2>
    <p class="sub">One flat monthly rate. All tools included. No per-file fees, no feature gating.</p>
    <div class="pricing-grid">
      <div class="card">
        <p class="name">Solo</p>
        <p class="price">$149<span>/mo</span></p>
        <p class="info">1 attorney &middot; All tools included</p>
        <ul class="feat-list"><li>4 AI analysis tools</li><li>100 docs/month</li><li>Wire fraud detection</li><li>Email support</li></ul>
        <a href="/api/subscribe?plan=solo" class="pricing-btn">Subscribe</a>
      </div>
      <div class="card hl">
        <p class="name">Small Firm</p>
        <p class="price">$349<span>/mo</span></p>
        <p class="info">Up to 5 seats &middot; All tools included</p>
        <ul class="feat-list"><li>Everything in Solo</li><li>500 docs/month</li><li>Multi-agent verification panel</li><li>Deal audit cross-referencing</li><li>Priority support</li></ul>
        <a href="/api/subscribe?plan=small_firm" class="pricing-btn">Subscribe</a>
      </div>
      <div class="card">
        <p class="name">Pro</p>
        <p class="price">$599<span>/mo</span></p>
        <p class="info">Up to 10 seats &middot; Priority support</p>
        <ul class="feat-list"><li>Everything in Small Firm</li><li>Unlimited docs</li><li>Tavily web verification</li><li>County records search</li><li>SMS/voice alerts</li><li>API access</li></ul>
        <a href="/api/subscribe?plan=pro" class="pricing-btn">Subscribe</a>
      </div>
      <div class="card">
        <p class="name">Enterprise</p>
        <p class="price">$999<span>/mo</span></p>
        <p class="info">25 seats &middot; Custom onboarding</p>
        <ul class="feat-list"><li>Everything in Pro</li><li>Dedicated account manager</li><li>Custom integrations</li><li>Fraud pattern database</li><li>SLA guarantee</li><li>SSO/SAML</li></ul>
        <a href="/api/subscribe?plan=enterprise" class="pricing-btn">Contact sales</a>
      </div>
    </div>
  </div>
</section>

<div class="faq-section">
  <div class="faq-inner">
    <h2 style="font-size:clamp(1.5rem,3vw,2rem);font-weight:800;letter-spacing:-0.03em;color:var(--text);margin-bottom:40px">Frequently asked questions</h2>
    <div class="faq-item">
      <div class="faq-q" onclick="toggleFaq(this)"><h3>What is TitleWise?</h3><span class="arrow">+</span></div>
      <div class="faq-a"><p>TitleWise is an AI-powered closing platform built specifically for real estate attorneys. It combines document analysis tools, wire fraud protection, TRID compliance checks, and an autonomous closing coordinator — so you can close faster with fewer errors.</p></div>
    </div>
    <div class="faq-item">
      <div class="faq-q" onclick="toggleFaq(this)"><h3>How is TitleWise different from Qualia or SoftPro?</h3><span class="arrow">+</span></div>
      <div class="faq-a"><p>Qualia, SoftPro, and similar platforms manage the production pipeline: escrow, title orders, scheduling, and closing workflow. They are not built to review documents. TitleWise is specifically built for examination intelligence — analyzing the content of title commitments, CDs, and other documents for issues that require attorney attention. The two categories solve different problems.</p></div>
    </div>
    <div class="faq-item">
      <div class="faq-q" onclick="toggleFaq(this)"><h3>How accurate is AI for reviewing closing documents?</h3><span class="arrow">+</span></div>
      <div class="faq-a"><p>For pattern-based review — detecting missing fields, flagging standard exceptions, identifying inconsistencies between documents — AI is highly reliable. For judgment calls that require legal interpretation, the attorney stays in the loop. TitleWise handles the former and surfaces the latter.</p></div>
    </div>
    <div class="faq-item">
      <div class="faq-q" onclick="toggleFaq(this)"><h3>Is my client data secure?</h3><span class="arrow">+</span></div>
      <div class="faq-a"><p>Yes. All data is encrypted in transit and at rest. Documents are processed to generate analysis for your matter only — never used to train AI models or shared with any third party.</p></div>
    </div>
    <div class="faq-item">
      <div class="faq-q" onclick="toggleFaq(this)"><h3>Which tools are included?</h3><span class="arrow">+</span></div>
      <div class="faq-a"><p>Wire Fraud Verification, Title Commitment Analysis, Closing Disclosure Review, HOA Document Review, Fee Estimate Generator, Tax Proration Calculator, Status Update Generator, Deal Memory, and the Autonomous Closing Agent. All tools are included with every subscription plan.</p></div>
    </div>
    <div class="faq-item">
      <div class="faq-q" onclick="toggleFaq(this)"><h3>Will AI replace title attorneys?</h3><span class="arrow">+</span></div>
      <div class="faq-a"><p>No. AI handles the repetitive, rules-based layer of title examination. The judgment work — evaluating risk, interpreting unusual easements, certifying title, advising clients — requires legal expertise and professional responsibility that no AI can substitute. TitleWise makes attorneys more productive, not replaceable.</p></div>
    </div>
  </div>
</div>

<div class="cta-section">
  <h2>Start closing smarter.</h2>
  <p>See exactly what TitleWise surfaces — wire fraud indicators, title exceptions, compliance issues — in the live analysis workspace.</p>
  <div class="ctas">
    <a href="#live-demo" class="btn-primary">Watch the demo</a>
    <a href="/demo" class="btn-secondary">Open full workspace</a>
  </div>
</div>

<footer>
  <div class="footer-inner">
    <div class="footer-grid">
      <div>
        <div class="footer-brand">
          <svg height="22" viewBox="0 0 36 43" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="10" y="0" width="24" height="32" rx="4" fill="var(--logo-back)"/>
            <rect x="2" y="8" width="24" height="32" rx="4" fill="var(--logo-front)"/>
          </svg>
          <span style="font-size:1rem;line-height:1"><b style="font-weight:700;color:var(--text);letter-spacing:-0.01em">TITLE</b><span style="font-weight:300;color:var(--muted)">wise</span></span>
        </div>
        <p class="footer-desc">AI-powered closing platform for real estate attorneys. From intake to clear-to-close.</p>
        <a href="https://boxfordpartners.com" target="_blank" rel="noopener noreferrer" class="footer-badge">
          <span class="dot"></span>
          <span class="txt">A Boxford Partners Company</span>
        </a>
      </div>
      <div class="footer-col">
        <p class="footer-col-title">Product</p>
        <ul>
          <li><a href="/pricing">Pricing</a></li>
          <li><a href="/demo">Demo</a></li>
          <li><a href="/blog">Blog</a></li>
        </ul>
      </div>
      <div class="footer-col">
        <p class="footer-col-title">Company</p>
        <ul>
          <li><a href="https://boxfordpartners.com" target="_blank" rel="noopener noreferrer">Boxford Partners</a></li>
          <li><a href="mailto:hello@titlewise.app">Contact</a></li>
        </ul>
      </div>
      <div class="footer-col">
        <p class="footer-col-title">Legal</p>
        <ul>
          <li><a href="/privacy">Privacy</a></li>
          <li><a href="/terms">Terms</a></li>
        </ul>
      </div>
    </div>
    <div class="footer-bottom">
      <p>&copy; 2026 Boxford Partners LLC. All rights reserved.</p>
    </div>
  </div>
</footer>

<script>
function setTheme(t){
  document.documentElement.setAttribute('data-theme',t);
  document.getElementById('btn-dark').classList.toggle('active',t==='dark');
  document.getElementById('btn-light').classList.toggle('active',t==='light');
  try{localStorage.setItem('tw-theme',t)}catch(e){}
}
function toggleFaq(el){
  var item=el.parentElement;
  item.classList.toggle('open');
}
(function(){var t;try{t=localStorage.getItem('tw-theme')}catch(e){}if(t)setTheme(t);})();
(function(){var v=document.getElementById('heroVideo');if(v){var s=v.querySelector('source');if(s&&s.src&&s.src!==window.location.href){v.style.display='block';v.load();}}})();

(function(){
  var tagClass = {extract:'t-extract',memory:'t-memory',analysis:'t-analysis',tavily:'t-tavily',adversarial:'t-adversarial',synthesis:'t-synthesis',alert:'t-alert',pipeline:'t-pipeline',audit:'t-audit',records:'t-records'};
  async function runInlineDemo(tool){
    var log = document.getElementById('inlineDemoLog');
    var verdict = document.getElementById('inlineDemoVerdict');
    var fraudBtn = document.getElementById('inlineDemoBtn');
    var safeBtn = document.getElementById('inlineSafeBtn');
    fraudBtn.disabled = true; safeBtn.disabled = true;
    log.innerHTML = '';
    verdict.className = 'demo-verdict';
    verdict.style.display = 'none';
    verdict.innerHTML = '';
    var res = await fetch('/api/demo-stream',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({tool:tool,document_text:'demo'})});
    var reader = res.body.getReader();
    var decoder = new TextDecoder();
    var buffer = '';
    var finalData = null;
    while(true){
      var r = await reader.read();
      if(r.done) break;
      buffer += decoder.decode(r.value,{stream:true});
      var lines = buffer.split('\\n');
      buffer = lines.pop() || '';
      for(var i=0;i<lines.length;i++){
        var line = lines[i];
        if(!line.startsWith('data: ')) continue;
        try{
          var evt = JSON.parse(line.slice(6));
          if(evt.stage==='final'){finalData=evt.data;continue;}
          var tc = tagClass[evt.stage]||'t-pipeline';
          var cls = evt.status==='complete'?'success':(evt.status==='error'?'danger':'');
          var el = document.createElement('div');
          el.className = 'dl-line';
          el.innerHTML = '<span class="dl-tag '+tc+'">'+(evt.agent||evt.stage)+'</span><span class="dl-msg '+cls+'">'+(evt.message||'')+'</span>';
          log.appendChild(el);
          log.scrollTop = log.scrollHeight;
        }catch(e){}
      }
    }
    if(finalData&&finalData.risk_synthesis){
      var rs = finalData.risk_synthesis;
      var isDanger = rs.composite_risk_score > 50;
      verdict.className = 'demo-verdict visible '+(isDanger?'danger':'safe');
      verdict.innerHTML = '<span class="dv-label">'+(isDanger?'CRITICAL':'LOW')+' RISK</span><span class="dv-sub">Score: '+rs.composite_risk_score+'/100 &mdash; '+(rs.signals||[]).slice(0,2).join(', ')+'</span>';
    }
    fraudBtn.disabled = false; safeBtn.disabled = false;
  }
  document.getElementById('inlineDemoBtn').addEventListener('click',function(){runInlineDemo('verify_wire_fraud');});
  document.getElementById('inlineSafeBtn').addEventListener('click',function(){runInlineDemo('verify_wire');});
})();

(function(){
  if(localStorage.getItem('tw-cookies'))return;
  var b=document.createElement('div');
  b.id='cookie-banner';
  b.innerHTML='<div class="cb-inner"><p>We use cookies to improve your experience and analyze site traffic. See our <a href="/privacy">Privacy Policy</a>.</p><div class="cb-btns"><button onclick="acceptCookies()">Accept</button><button onclick="declineCookies()">Decline</button></div></div>';
  document.body.appendChild(b);
})();
function acceptCookies(){localStorage.setItem('tw-cookies','accepted');document.getElementById('cookie-banner').remove();}
function declineCookies(){localStorage.setItem('tw-cookies','declined');document.getElementById('cookie-banner').remove();}

if(navigator.modelContext&&navigator.modelContext.provideContext){
  navigator.modelContext.provideContext({tools:[
    {name:"analyze_commitment",description:"Analyze a title commitment document for red flags, requirements, and exceptions",inputSchema:{type:"object",properties:{document_text:{type:"string",description:"Full text of the title commitment"}},required:["document_text"]},execute:async function(i){var r=await fetch("/api/analyze",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({tool:"analyze_commitment",document_text:i.document_text})});return r.json();}},
    {name:"verify_wire",description:"Detect wire fraud indicators in transfer instructions",inputSchema:{type:"object",properties:{document_text:{type:"string",description:"Wire transfer instructions text"}},required:["document_text"]},execute:async function(i){var r=await fetch("/api/analyze",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({tool:"verify_wire",document_text:i.document_text})});return r.json();}},
    {name:"analyze_closing_disclosure",description:"TRID compliance review of a Closing Disclosure",inputSchema:{type:"object",properties:{document_text:{type:"string",description:"Full text of the Closing Disclosure"}},required:["document_text"]},execute:async function(i){var r=await fetch("/api/analyze",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({tool:"analyze_closing_disclosure",document_text:i.document_text})});return r.json();}},
    {name:"review_hoa",description:"Extract fees, restrictions, and transfer requirements from HOA documents",inputSchema:{type:"object",properties:{document_text:{type:"string",description:"Full text of the HOA document"}},required:["document_text"]},execute:async function(i){var r=await fetch("/api/analyze",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({tool:"review_hoa",document_text:i.document_text})});return r.json();}}
  ]});
}
</script>

</body>
</html>`;
}

function tryPageHTML(baseUrl: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>TitleWise — Live Analysis</title>
<link rel="icon" type="image/svg+xml" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 36 43'%3E%3Crect x='10' y='0' width='24' height='32' rx='4' fill='%23ffffff59'/%3E%3Crect x='2' y='8' width='24' height='32' rx='4' fill='%232563EB'/%3E%3C/svg%3E">
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#0a0a0f;color:#e4e4e7;min-height:100vh}
.top-bar{display:flex;align-items:center;justify-content:space-between;padding:0.6rem 1.5rem;border-bottom:1px solid #1e293b;background:#0f172a;z-index:10;position:relative}
.top-bar h1{font-size:1rem;color:#fff}
.top-bar a{color:#60a5fa;font-size:0.8rem;text-decoration:none}
.layout{display:grid;grid-template-columns:1fr 1fr 1.5fr;grid-template-rows:1fr;height:calc(100vh - 41px)}
@media(max-width:1200px){.layout{grid-template-columns:1fr 1fr 1fr}}
@media(max-width:1024px){.layout{grid-template-columns:1fr 1fr;grid-template-rows:1fr 1fr;height:auto;min-height:calc(100vh - 41px);overflow:auto}.right-panel{grid-column:1/-1}}
@media(max-width:800px){.layout{grid-template-columns:1fr;grid-template-rows:auto auto 1fr;height:auto;min-height:calc(100vh - 41px);overflow:auto}}
.col-header{padding:0.5rem 0.75rem;background:#0f172a;border-bottom:1px solid #1e293b;display:flex;align-items:center;justify-content:space-between}
.col-header h3{font-size:0.7rem;text-transform:uppercase;letter-spacing:0.05em;color:#64748b}
.col-header .col-badge{font-size:0.6rem;padding:0.15rem 0.4rem;border-radius:3px;background:#1e293b;color:#94a3b8}
.left-panel{display:flex;flex-direction:column;border-right:1px solid #1e293b;overflow:visible}
@media(max-width:800px){.left-panel{min-height:420px;overflow:visible;border-right:none;border-bottom:1px solid #1e293b}.center-panel{min-height:300px;border-right:none;border-bottom:1px solid #1e293b}.right-panel{min-height:350px}}
.toolbar{display:flex;gap:0.4rem;padding:0.5rem 0.75rem;border-bottom:1px solid #1e293b;flex-wrap:wrap}
.tool-btn{padding:0.25rem 0.5rem;border-radius:4px;border:1px solid #334155;background:#1e293b;color:#e2e8f0;font-size:0.65rem;cursor:pointer;transition:all 0.15s}
.tool-btn:hover{border-color:#3b82f6}
.tool-btn.active{background:#1e3a5f;border-color:#2563eb;color:#93c5fd}
.samples{display:flex;gap:0.3rem;padding:0.35rem 0.75rem;border-bottom:1px solid #1e293b}
.sample-btn{padding:0.2rem 0.4rem;border-radius:3px;border:1px solid #27272a;background:transparent;color:#94a3b8;font-size:0.6rem;cursor:pointer}
.sample-btn:hover{border-color:#3b82f6;color:#93c5fd}
textarea{flex:1;background:#09090b;border:none;padding:0.75rem;font-family:'SF Mono',Monaco,monospace;font-size:0.68rem;line-height:1.4;color:#e2e8f0;resize:none;outline:none}
textarea::placeholder{color:#475569}
.run-bar{padding:0.75rem;border-top:1px solid #1e293b;background:#111827;display:flex;align-items:center;gap:0.5rem}
.run-btn{padding:0.6rem 1.5rem;background:#2563eb;color:#fff;border:none;border-radius:6px;font-size:0.875rem;font-weight:600;cursor:pointer;transition:all 0.2s;min-height:44px}
.run-btn:hover{background:#1d4ed8;transform:scale(1.02)}
.run-btn:disabled{background:#334155;color:#64748b;cursor:not-allowed;transform:none}
.run-status{font-size:0.65rem;color:#64748b}
.center-panel{display:flex;flex-direction:column;border-right:1px solid #1e293b;overflow:hidden;background:#09090b}
.facts-body{flex:1;overflow-y:auto;padding:0.75rem}
.fact-group{margin-bottom:1rem}
.fact-group-title{font-size:0.6rem;text-transform:uppercase;letter-spacing:0.08em;color:#475569;margin-bottom:0.4rem;font-weight:600}
.fact-item{font-size:0.72rem;color:#e2e8f0;padding:0.3rem 0.6rem;border-left:3px solid #334155;margin-bottom:0.35rem;font-family:'SF Mono',Monaco,monospace;transition:all 0.3s}
.fact-item.verified{border-left-color:#4ade80;background:#05291610}
.fact-item.unverified{border-left-color:#f87171;background:#7f1d1d10}
.fact-item.mismatch{border-left-color:#f87171;background:#7f1d1d20;animation:pulse 2s infinite}
.fact-item.new{border-left-color:#3b82f6;animation:slideIn 0.4s forwards}
@keyframes slideIn{from{transform:translateX(-10px);opacity:0}to{transform:translateX(0);opacity:1}}
.fact-empty{font-size:0.72rem;color:#475569;font-style:italic;padding:2.5rem 1rem;text-align:center;line-height:1.6}
.deal-counter{display:flex;align-items:center;gap:0.75rem;padding:0.6rem 0.75rem;border-top:1px solid #1e293b;background:#0f172a}
.deal-counter-num{font-size:1.8rem;font-weight:700;color:#3b82f6;line-height:1}
.deal-counter-label{font-size:0.6rem;color:#64748b;text-transform:uppercase;letter-spacing:0.04em}
.deal-status{padding:0.75rem;border-bottom:1px solid #1e293b;text-align:center;transition:all 0.5s}
.deal-status.in-progress{background:#0f172a}
.deal-status.ready{background:#052e16;border-bottom-color:#16a34a40;animation:glow 2s infinite}
.deal-status.hold{background:#7f1d1d30;border-bottom-color:#991b1b80;animation:pulse 2s infinite}
@keyframes glow{0%,100%{box-shadow:inset 0 0 10px #16a34a20}50%{box-shadow:inset 0 0 20px #16a34a40}}
.deal-status-label{font-size:0.65rem;font-weight:700;text-transform:uppercase;letter-spacing:0.08em}
.deal-status.in-progress .deal-status-label{color:#64748b}
.deal-status.ready .deal-status-label{color:#4ade80}
.deal-status.hold .deal-status-label{color:#f87171}
.deal-status.archived{background:#1e1b4b;border-bottom-color:#6366f180}
.deal-status.archived .deal-status-label{color:#a5b4fc}
.deal-status-sub{font-size:0.6rem;color:#94a3b8;margin-top:0.25rem}
.deal-actions{display:flex;flex-wrap:wrap;gap:0.4rem;justify-content:center;margin-top:0.5rem}
.deal-action-btn{padding:0.3rem 0.6rem;border-radius:4px;border:1px solid #16a34a;background:#16a34a20;color:#4ade80;font-size:0.6rem;font-weight:600;cursor:pointer;transition:all 0.15s}
.deal-action-btn:hover{background:#16a34a40;transform:scale(1.03)}
.deal-action-btn.danger{border-color:#dc2626;background:#dc262620;color:#fca5a5}
.deal-action-btn.danger:hover{background:#dc262640}
.right-panel{display:flex;flex-direction:column;overflow:hidden;position:relative}
.right-header{padding:0.5rem 0.75rem;border-bottom:1px solid #1e293b;background:#111827;display:flex;align-items:center;justify-content:space-between}
.right-header h2{font-size:0.7rem;text-transform:uppercase;letter-spacing:0.05em;color:#64748b}
.toggle-view{padding:0.2rem 0.45rem;border-radius:3px;border:1px solid #334155;background:transparent;color:#94a3b8;font-size:0.6rem;cursor:pointer}
.toggle-view.active{background:#1e3a5f;border-color:#2563eb;color:#93c5fd}
.right-content{flex:1;overflow-y:auto;position:relative}
.result-pane{padding:1rem;display:none}
.result-pane.visible{display:block}
.activity-pane{display:none;height:100%;overflow:hidden}
.activity-pane.visible{display:flex;flex-direction:column}
.activity-log{flex:1;overflow-y:auto;padding:0.75rem;background:#000;font-family:'SF Mono',Monaco,monospace;font-size:0.7rem;line-height:1.8}
.log-line{opacity:0;animation:fadeIn 0.3s forwards;display:flex;gap:0.5rem;align-items:flex-start}
@keyframes fadeIn{to{opacity:1}}
.log-ts{color:#475569;min-width:65px;flex-shrink:0}
.log-tag{padding:0.1rem 0.35rem;border-radius:3px;font-size:0.6rem;font-weight:600;min-width:52px;text-align:center;flex-shrink:0}
.log-tag.auth{background:#164e63;color:#67e8f9}
.log-tag.mcp{background:#1e3a5f;color:#93c5fd}
.log-tag.ai{background:#3b0764;color:#d8b4fe}
.log-tag.verify{background:#422006;color:#fbbf24}
.log-tag.memory{background:#052e16;color:#86efac}
.log-tag.result{background:#1c1917;color:#fff}
.log-tag.alert{background:#7f1d1d;color:#fca5a5;animation:pulse 2s infinite}
.log-tag.audit{background:#312e81;color:#a5b4fc}
.log-msg{color:#e2e8f0}
.log-msg.dim{color:#64748b}
.log-msg.warn{color:#fbbf24}
.log-msg.danger{color:#f87171}
.log-msg.success{color:#4ade80}
.activity-header{padding:0.5rem 0.75rem;background:#0a0a0f;border-bottom:1px solid #1e293b;display:flex;align-items:center;gap:0.5rem}
.activity-dot{width:7px;height:7px;border-radius:50%;background:#334155}
.activity-dot.live{background:#f87171;animation:blink 1s infinite}
@keyframes blink{50%{opacity:0.3}}
.activity-title{font-size:0.7rem;color:#94a3b8;text-transform:uppercase;letter-spacing:0.05em}
.verdict-bar{padding:0.6rem 0.75rem;background:#09090b;border-top:1px solid #1e293b;display:none;align-items:center;gap:0.5rem}
.verdict-bar.visible{display:flex}
.verdict-bar.safe{border-top-color:#16653480}
.verdict-bar.danger{border-top-color:#991b1b80}
.verdict-icon{font-size:1.1rem}
.verdict-text{font-size:0.8rem;font-weight:600}
.verdict-bar.safe .verdict-text{color:#4ade80}
.verdict-bar.danger .verdict-text{color:#f87171}
.verdict-sub{font-size:0.7rem;color:#64748b;margin-left:auto}
.result-json{font-family:'SF Mono',Monaco,monospace;font-size:0.7rem;line-height:1.5;color:#e2e8f0;white-space:pre-wrap;word-break:break-word;padding:1rem}
.result-json .key{color:#93c5fd}
.result-json .string{color:#86efac}
.result-json .number{color:#fbbf24}
.result-json .bool{color:#c084fc}
.placeholder{color:#475569;font-size:0.85rem;line-height:1.6;padding:3rem 2rem;text-align:center}
@keyframes notifyProgress{0%{width:0%}100%{width:100%}}
</style>
</head>
<body>
<div class="top-bar">
  <h1>TitleWise Live Analysis</h1>
  <a href="/">&larr; Back to gateway</a>
</div>
<div class="layout">
  <!-- Column 1: Source Document -->
  <div class="left-panel">
    <div class="col-header">
      <h3>Source Document</h3>
      <span class="col-badge">INPUT</span>
    </div>
    <div class="toolbar">
      <button class="tool-btn" data-tool="auto" style="background:#1e3a5f;border-color:#2563eb;color:#93c5fd">Full Analysis</button>
      <button class="tool-btn active" data-tool="verify_wire">Wire Fraud</button>
      <button class="tool-btn" data-tool="analyze_commitment">Title Commitment</button>
      <button class="tool-btn" data-tool="analyze_closing_disclosure">Closing Disclosure</button>
      <button class="tool-btn" data-tool="review_hoa">HOA</button>
    </div>
    <div class="samples">
      <button class="sample-btn" data-sample="wire_safe">1. Wire</button>
      <button class="sample-btn" data-sample="wire_fraud">2. Wire (BEC)</button>
      <button class="sample-btn" data-sample="commitment">3. Commitment</button>
      <button class="sample-btn" data-sample="closing_disclosure">4. CD</button>
      <button class="sample-btn" data-sample="hoa">5. HOA</button>
    </div>
    <div id="dropZone" style="padding:0.6rem 0.75rem;border-bottom:1px solid #1e293b;text-align:center;cursor:pointer;transition:all 0.2s;background:#09090b">
      <div style="border:1px dashed #334155;border-radius:6px;padding:0.5rem;font-size:0.65rem;color:#64748b;transition:all 0.2s" id="dropInner">
        Drop file here or <span style="color:#60a5fa;text-decoration:underline">browse</span> — stored in Cloudflare R2
      </div>
      <input type="file" id="fileInput" accept=".txt,.pdf,.doc,.docx" style="display:none">
    </div>
    <textarea id="input" placeholder="Paste wire instructions, title commitment, closing disclosure, or HOA document here..."></textarea>
    <div class="run-bar">
      <button class="run-btn" id="autoDemoBtn" style="background:#8b5cf6">One-Click Demo</button>
      <button class="run-btn" id="runBtn" style="background:#1e293b;border:1px solid #334155;color:#e2e8f0">Analyze</button>
      <span class="run-status" id="runStatus"></span>
    </div>
  </div>

  <!-- Column 2: Deal Facts (builds up across documents) -->
  <div class="center-panel">
    <div class="col-header">
      <h3>Deal Facts</h3>
      <span class="col-badge" id="docCount">0 docs</span>
    </div>
    <div class="deal-status in-progress" id="dealStatus">
      <div class="deal-status-label" id="dealStatusLabel">Awaiting Documents</div>
      <div class="deal-status-sub" id="dealStatusSub">Submit documents to build the deal file</div>
      <div class="deal-actions" id="dealActions" style="display:none"></div>
    </div>
    <div class="facts-body" id="factsBody">
      <div class="fact-group"><div class="fact-group-title">Property</div><div class="fact-item"><span style="opacity:0.3">Pending...</span></div></div>
      <div class="fact-group"><div class="fact-group-title">Parties</div><div class="fact-item">Buyer: <span style="opacity:0.3">Pending...</span></div><div class="fact-item">Seller: <span style="opacity:0.3">Pending...</span></div></div>
      <div class="fact-group"><div class="fact-group-title">Transaction</div><div class="fact-item"><span style="opacity:0.3">Awaiting transaction details...</span></div></div>
      <div class="fact-group"><div class="fact-group-title">Lender / Loan</div><div class="fact-item"><span style="opacity:0.3">Pending lender details...</span></div></div>
      <div class="fact-group"><div class="fact-group-title">Closing Checklist</div><div class="fact-item" style="font-size:0.68rem;opacity:0.5">&#8195; Pre-Qualification</div><div class="fact-item" style="font-size:0.68rem;opacity:0.5">&#8195; Loan Application</div><div class="fact-item" style="font-size:0.68rem;opacity:0.5">&#8195; Appraisal</div><div class="fact-item" style="font-size:0.68rem;opacity:0.5">&#8195; Title Search</div><div class="fact-item" style="font-size:0.68rem;opacity:0.5">&#8195; Underwriting</div><div class="fact-item" style="font-size:0.68rem;opacity:0.5">&#8195; Conditional Approval</div><div class="fact-item" style="font-size:0.68rem;opacity:0.5">&#8195; Clear to Close</div><div class="fact-item" style="font-size:0.68rem;opacity:0.5">&#8195; Funded</div></div>
      <div class="fact-group"><div class="fact-group-title">Title / Escrow</div><div class="fact-item"><span style="opacity:0.3">Pending...</span></div></div>
      <div class="fact-group"><div class="fact-group-title">Wire Instructions</div><div class="fact-item"><span style="opacity:0.3">No wire instructions yet...</span></div></div>
    </div>
    <div class="deal-counter">
      <div class="deal-counter-num" id="agentCountDisplay">15</div>
      <div>
        <div class="deal-counter-label">Agents Available</div>
      </div>
    </div>
  </div>

  <!-- Column 3: Agent Activity + Verdict -->
  <div class="right-panel">
    <div class="right-header">
      <h2>Agent Activity</h2>
      <div>
        <button class="toggle-view active" id="toggleActivity">Live</button>
        <button class="toggle-view" id="toggleResult">JSON</button>
      </div>
    </div>
    <div class="right-content">
      <div class="activity-pane visible" id="activityPane">
        <div class="activity-header">
          <div class="activity-dot" id="liveDot"></div>
          <div class="activity-title">Agent Conversation</div>
        </div>
        <div class="activity-log" id="activityLog">
          <div class="log-line"><span class="log-msg dim">Click "One-Click Demo" to see a live fraud detection walkthrough, or paste your own document and click "Analyze".</span></div>
        </div>
        <div class="verdict-bar" id="verdictBar">
          <span class="verdict-icon" id="verdictIcon"></span>
          <span class="verdict-text" id="verdictText"></span>
          <span class="verdict-sub" id="verdictSub"></span>
        </div>
      </div>
      <div class="result-pane" id="resultPane"></div>
    </div>
  </div>
</div>
<script>
const SAMPLES = {
  wire_safe: \`WIRE TRANSFER INSTRUCTIONS
Meridian Title & Escrow, Inc.
File No: 2024-SF-41892
Date: August 22, 2024
Property: 2847 Pacific Heights Boulevard, San Francisco, CA 94115

Dear Mr. and Mrs. Nakamura,

Please wire closing funds to the following account per our agreed upon terms:

Bank: First Republic Bank
Routing: 321081669
Account: 7294018356
Beneficiary: Meridian Title & Escrow Inc
Amount: $412,750.00
Reference: Nakamura/2847 Pacific Heights - File 2024-SF-41892

Please initiate wire no later than August 26, 2024 (48 hours prior to closing).
Funds must be received same-day to avoid delay.

If you have any questions, contact me directly:
Rachel Dominguez, Senior Escrow Officer
Direct: (415) 729-4100 ext. 312
rachel.dominguez@meridiantitle.com

IMPORTANT: We will NEVER change wiring instructions via email.
If you receive updated instructions, call our office immediately.\`,
  wire_fraud: \`UPDATED WIRE INSTRUCTIONS - PLEASE READ IMMEDIATELY
File No: 2024-SF-41892
Date: August 25, 2024
Property: 2847 Pacific Heights Boulevard, San Francisco, CA 94115

Dear Mr. and Mrs. Nakamura,

Due to a compliance audit on our primary account, our banking team has moved closing escrow deposits to a new account effective today. Please disregard the previous wire instructions sent on August 22nd and use the updated information below:

Bank: Metro Commercial Bank
Routing: 026013958
Account: 8819204756
Beneficiary: Meridian Title Holdings LLC
Amount: $412,750.00
Reference: File 2024-SF-41892

This change is effective immediately. Please complete the wire today to keep your closing on schedule for August 28th. Our phone lines are currently down for scheduled maintenance until 5pm PT, so please confirm via email only.

Thank you for your understanding,
Rachel Dominguez
Senior Escrow Officer
Meridian Title & Escrow\`,
  commitment: \`COMMITMENT FOR TITLE INSURANCE
Meridian Title & Escrow, Inc.
Commitment No: 2024-0041892
Effective Date: August 18, 2024
Fee: $2,150.00

Proposed Insured: Kenji Nakamura and Yuki Nakamura, husband and wife, as community property
Proposed Policy Amount: $1,850,000.00

1. ESTATE OR INTEREST: Fee Simple
2. TITLE VESTED IN: The Margaret Chen Revocable Living Trust, dated April 3, 2019
3. PROPERTY ADDRESS: 2847 Pacific Heights Boulevard, San Francisco, CA 94115
   APN: 1024-037
   Legal Description: Lot 12, Block 3297, per Map recorded in Book 42, Page 87, SF Records

SCHEDULE B - REQUIREMENTS:
1. Payment of all real property taxes and assessments currently due and payable
2. Deed from The Margaret Chen Revocable Living Trust to Kenji Nakamura and Yuki Nakamura
3. Trustee\\'s Certificate and Authorization for Trust conveyance
4. Satisfaction of Deed of Trust dated 06/15/2020, recorded as Doc 2020-K481927, beneficiary: JPMorgan Chase Bank NA, original amount $1,200,000.00
5. Payoff demand from JPMorgan Chase Bank NA
6. Transfer Tax Declaration - City and County of San Francisco
7. Compliance with SF Building Inspection requirements (3R Report)
8. HOA estoppel letter from Pacific Heights Owners Association

SCHEDULE B - EXCEPTIONS FROM COVERAGE:
1. General and special real property taxes for fiscal year 2024-2025 (1st installment: $11,247.00 due 11/1/2024)
2. Supplemental taxes assessed pursuant to Chapter 3.5 of the Revenue and Taxation Code
3. Easement for public utilities and incidental purposes, recorded 04/12/1952, Book 2847, Page 412
4. Declaration of Covenants, Conditions and Restrictions for Pacific Heights Owners Association, recorded 06/30/1988, Doc 1988-H294015, and all amendments thereto
5. Deed of Trust dated 06/15/2020, recorded as Doc 2020-K481927, in favor of JPMorgan Chase Bank NA (to be paid off at closing)
6. Notice of Special Tax Lien - Community Facilities District No. 2019-1, recorded 09/15/2019, Doc 2019-L582941

Prepared by: Meridian Title & Escrow, Inc.
Title Officer: David Park
Contact: david.park@meridiantitle.com | (415) 729-4100 ext. 205\`,
  closing_disclosure: \`CLOSING DISCLOSURE
File No: 2024-SF-41892
Closing Date: August 28, 2024
Property: 2847 Pacific Heights Boulevard, San Francisco, CA 94115

BORROWER: Kenji Nakamura and Yuki Nakamura
SELLER: The Margaret Chen Revocable Living Trust
LENDER: Wells Fargo Home Mortgage
Settlement Agent: Meridian Title & Escrow Inc

LOAN TERMS:
Loan Amount: $1,480,000.00
Interest Rate: 6.375%
Monthly P&I: $9,231.47
Loan Type: 30-Year Fixed Conventional

COSTS AT CLOSING:
Closing Costs Paid at Closing:           $28,472.00
  - Origination Fee:                      $7,400.00
  - Appraisal Fee:                          $875.00
  - Credit Report:                           $65.00
  - Title Insurance (Owner):              $2,150.00
  - Title Insurance (Lender):            $1,875.00
  - Escrow Fee:                           $3,200.00
  - Recording Fees:                         $450.00
  - Transfer Tax (SF):                   $10,175.00
  - HOA Transfer Fee:                       $500.00
  - 3R Report:                              $400.00
  - Notary:                                 $200.00
  - Wire Fee:                                $35.00
  - Document Prep:                          $147.00

CASH TO CLOSE:
Purchase Price:                       $1,850,000.00
Loan Amount:                         -$1,480,000.00
Closing Costs:                           $28,472.00
Prepaid Items:                           $14,278.00
  - Homeowner Insurance (12 mo):          $4,200.00
  - Property Taxes (6 mo):                $5,623.50
  - Prepaid Interest (3 days):            $4,454.50
Adjustments:                            -$60,000.00
  - Earnest Money Deposit:              -$50,000.00
  - Seller Credit:                      -$10,000.00
TOTAL CASH TO CLOSE:                    $412,750.00

Beneficiary: Meridian Title & Escrow Inc
Bank: First Republic Bank
Routing: 321081669
Reference: 2024-SF-41892\`,
  hoa: \`PACIFIC HEIGHTS OWNERS ASSOCIATION
RESALE CERTIFICATE & ESTOPPEL LETTER

Date: August 20, 2024
Property: 2847 Pacific Heights Boulevard, Unit N/A (SFR)
APN: 1024-037
Owner of Record: The Margaret Chen Revocable Living Trust
Buyer: Kenji Nakamura and Yuki Nakamura
Escrow File: 2024-SF-41892
Settlement Agent: Meridian Title & Escrow Inc

ASSOCIATION INFORMATION:
Association Name: Pacific Heights Owners Association
Management Company: Pinnacle Property Management
Manager: Thomas Reeves
Phone: (415) 882-4400
Email: treeves@pinnaclepm.com

FINANCIAL SUMMARY:
Monthly Assessment: $875.00
Special Assessment: $2,400.00 (approved 03/2024, exterior painting - 12 monthly installments of $200, 6 remaining)
Transfer Fee: $500.00 (due at closing)
Working Capital Contribution: $1,750.00 (2x monthly, due from buyer)
Outstanding Balance on Unit: $0.00 (current through August 2024)

RESERVE FUND STATUS:
Reserve Fund Balance: $847,291.00
Reserve Study Date: January 2023
Funded Percentage: 78%
Next Reserve Study Due: January 2026

PENDING OR ANTICIPATED SPECIAL ASSESSMENTS:
- Roof replacement (estimated 2026): $15,000-$22,000 per unit (not yet approved)
- No litigation pending against the Association

GOVERNING DOCUMENTS:
- CC&Rs recorded 06/30/1988, Doc 1988-H294015 (last amended 2021)
- Bylaws (amended 2019)
- Rules and Regulations (revised January 2024)

INSURANCE:
Master Policy: Hartford Insurance, Policy #PHO-2024-8847
Coverage: $12,000,000 all-risk property, $5,000,000 general liability
Earthquake: Not included in master policy (owners responsible)
D&O: $2,000,000

RESTRICTIONS & NOTES:
- Minimum lease term: 12 months (no short-term rentals)
- Maximum 2 pets (dogs/cats only, under 50 lbs)
- Architectural review required for exterior modifications
- Street parking by permit only (2 permits per unit)
- Move-in deposit: $1,000 (refundable)

DELINQUENCY HISTORY:
Unit 2847: No delinquencies in past 24 months.

CERTIFICATION:
I certify the above information is accurate as of the date of this letter.

Thomas Reeves, CMCA
Community Manager
Pinnacle Property Management
Date: August 20, 2024\`
};

let activeTool = 'verify_wire';
let startTime = 0;
let docCount = 0;
let deal = {
  property: { address: null, apn: null, legal: null },
  parties: { buyers: [], sellers: [], buyerAgent: null, sellerAgent: null, lender: null },
  transaction: { purchasePrice: null, loanAmount: null, cashToClose: null, closingDate: null, fileNumber: null },
  loan: { lender: null, type: null, rate: null, amount: null, term: null },
  milestones: { preQual: false, application: false, appraisal: false, titleSearch: false, underwriting: false, conditionalApproval: false, clearToClose: false, funded: false },
  titleCompany: { name: null, officer: null, phone: null, email: null },
  wire: { bank: null, routing: null, account: null, beneficiary: null, amount: null },
  flags: [],
  rawEntities: { beneficiaries: [], routingNumbers: [], banks: [], amounts: [], addresses: [] },
  documentsReceived: [],
  archived: false,
};

const REQUIRED_CLOSING_DOCS = [
  { key: 'wire_instructions', label: 'Wire Instructions (Verified)', tools: ['verify_wire'] },
  { key: 'title_commitment', label: 'Title Commitment', tools: ['analyze_commitment'] },
  { key: 'closing_disclosure', label: 'Closing Disclosure', tools: ['analyze_closing_disclosure'] },
  { key: 'hoa_estoppel', label: 'HOA Estoppel / Resale Certificate', tools: ['review_hoa'] },
  { key: 'deed', label: 'Deed of Trust / Mortgage', tools: [] },
  { key: 'survey', label: 'Survey / Plat', tools: [] },
  { key: 'insurance', label: 'Homeowner\\'s Insurance Binder', tools: [] },
  { key: 'tax_cert', label: 'Tax Certification', tools: [] },
];

document.querySelectorAll('.tool-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tool-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    activeTool = btn.dataset.tool;
  });
});

document.querySelectorAll('.sample-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.getElementById('input').value = SAMPLES[btn.dataset.sample];
    document.querySelectorAll('.tool-btn').forEach(b => b.classList.remove('active'));
    if (btn.dataset.sample.startsWith('wire')) {
      document.querySelector('[data-tool="verify_wire"]').classList.add('active');
      activeTool = 'verify_wire';
    } else if (btn.dataset.sample === 'commitment') {
      document.querySelector('[data-tool="analyze_commitment"]').classList.add('active');
      activeTool = 'analyze_commitment';
    } else if (btn.dataset.sample === 'closing_disclosure') {
      document.querySelector('[data-tool="analyze_closing_disclosure"]').classList.add('active');
      activeTool = 'analyze_closing_disclosure';
    } else if (btn.dataset.sample === 'hoa') {
      document.querySelector('[data-tool="review_hoa"]').classList.add('active');
      activeTool = 'review_hoa';
    }
  });
});

// File upload / drag-and-drop
const dropZone = document.getElementById('dropZone');
const dropInner = document.getElementById('dropInner');
const fileInput = document.getElementById('fileInput');

dropZone.addEventListener('click', () => fileInput.click());
dropZone.addEventListener('dragover', (e) => { e.preventDefault(); dropInner.style.borderColor = '#3b82f6'; dropInner.style.background = '#1e3a5f20'; });
dropZone.addEventListener('dragleave', () => { dropInner.style.borderColor = '#334155'; dropInner.style.background = 'transparent'; });
dropZone.addEventListener('drop', async (e) => {
  e.preventDefault();
  dropInner.style.borderColor = '#334155';
  dropInner.style.background = 'transparent';
  const file = e.dataTransfer?.files?.[0];
  if (file) await handleFileUpload(file);
});
fileInput.addEventListener('change', async (e) => {
  const file = e.target.files?.[0];
  if (file) await handleFileUpload(file);
});

async function handleFileUpload(file) {
  dropInner.innerHTML = '<span style="color:#fbbf24">Uploading ' + file.name + ' to R2...</span>';

  const formData = new FormData();
  formData.append('file', file);
  formData.append('fileNumber', deal.transaction.fileNumber || '2024-SF-41892');

  try {
    const res = await fetch('/api/upload', { method: 'POST', body: formData });
    const data = await res.json();
    if (data.success && data.text) {
      document.getElementById('input').value = data.text;
      const version = data.version || 1;
      const stored = data.key ? ' | Stored: ' + data.key : '';
      dropInner.innerHTML = '<span style="color:#4ade80">\\u2713 ' + file.name + ' (v' + version + ')' + stored + '</span>' + (data.has_prior_version ? ' <span style="color:#fbbf24;font-size:0.55rem">PRIOR VERSION DETECTED</span>' : '');

      // Auto-detect: use "auto" mode so ALL document types in the PDF get analyzed
      activeTool = 'auto';
      document.querySelectorAll('.tool-btn').forEach(b => b.classList.remove('active'));
    } else {
      dropInner.innerHTML = '<span style="color:#f87171">Upload failed: ' + (data.error || 'unknown') + '</span>';
    }
  } catch (e) {
    dropInner.innerHTML = '<span style="color:#f87171">Upload error: ' + e.message + '</span>';
  }
}

// One-Click Demo — replays pre-baked SSE events (no API calls)
document.getElementById('autoDemoBtn').addEventListener('click', async () => {
  const demoOrder = ['verify_wire', 'verify_wire_fraud'];
  const demoLabels = { verify_wire: 'Wire (Safe)', verify_wire_fraud: 'Wire (Fraud)' };
  const btn = document.getElementById('autoDemoBtn');
  btn.disabled = true;
  btn.textContent = 'Running...';

  for (let i = 0; i < demoOrder.length; i++) {
    const tool = demoOrder[i];
    btn.textContent = (i + 1) + '/' + demoOrder.length + ' ' + demoLabels[tool];

    const logEl = document.getElementById('activityLog');
    logEl.innerHTML = '';
    document.getElementById('liveDot').classList.add('live');
    document.getElementById('verdictBar').classList.remove('visible','safe','danger');
    document.getElementById('activityPane').classList.add('visible');
    document.getElementById('resultPane').classList.remove('visible');
    document.getElementById('toggleActivity').classList.add('active');
    document.getElementById('toggleResult').classList.remove('active');
    document.getElementById('runStatus').textContent = 'Demo: ' + demoLabels[tool];
    startTime = Date.now();
    log('mcp', 'Demo: <b>' + tool + '</b>', '');

    const res = await fetch('${baseUrl}/api/demo-stream', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tool: tool, document_text: 'demo' })
    });

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let finalData = null;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\\n');
      buffer = lines.pop() || '';
      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        try {
          const event = JSON.parse(line.slice(6));
          if (event.stage === 'final') { finalData = event.data; continue; }
          const label = event.agent || event.stage;
          const cls = event.status === 'complete' ? 'success' : (event.status === 'error' ? 'danger' : '');
          log(event.stage, '<b>' + label + '</b> ' + (event.message || ''), cls);
        } catch {}
      }
    }

    document.getElementById('liveDot').classList.remove('live');
    if (finalData && finalData.risk_synthesis) {
      const risk = finalData.risk_synthesis;
      const bar = document.getElementById('verdictBar');
      bar.classList.add('visible');
      bar.classList.add(risk.composite_risk_score > 50 ? 'danger' : 'safe');
      bar.innerHTML = '<b>' + risk.risk_level + ' RISK</b> — Score: ' + risk.composite_risk_score + '/100 — ' + (risk.signals || []).join(', ');
      document.getElementById('resultContent').innerHTML = '<pre>' + JSON.stringify(finalData, null, 2) + '</pre>';
      document.getElementById('resultPane').classList.add('visible');
      document.getElementById('toggleResult').classList.add('active');
      document.getElementById('toggleActivity').classList.remove('active');
      document.getElementById('activityPane').classList.remove('visible');
    }
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    document.getElementById('runStatus').textContent = 'Demo complete (' + elapsed + 's)';

    if (i < demoOrder.length - 1) await delay(2000);
  }
  btn.disabled = false;
  btn.textContent = 'One-Click Demo';
});

document.getElementById('toggleActivity').addEventListener('click', () => {
  document.getElementById('activityPane').classList.add('visible');
  document.getElementById('resultPane').classList.remove('visible');
  document.getElementById('toggleActivity').classList.add('active');
  document.getElementById('toggleResult').classList.remove('active');
});
document.getElementById('toggleResult').addEventListener('click', () => {
  document.getElementById('resultPane').classList.add('visible');
  document.getElementById('activityPane').classList.remove('visible');
  document.getElementById('toggleResult').classList.add('active');
  document.getElementById('toggleActivity').classList.remove('active');
});

function elapsed() { return ((Date.now() - startTime) / 1000).toFixed(2) + 's'; }

function log(tag, msg, cls) {
  const el = document.getElementById('activityLog');
  const line = document.createElement('div');
  line.className = 'log-line';
  line.innerHTML = '<span class="log-ts">' + elapsed() + '</span><span class="log-tag ' + tag + '">' + tag.toUpperCase() + '</span><span class="log-msg ' + (cls||'') + '">' + msg + '</span>';
  el.appendChild(line);
  el.scrollTop = el.scrollHeight;
}

async function delay(ms) { return new Promise(r => setTimeout(r, ms + Math.random() * ms * 0.4)); }

document.getElementById('runBtn').addEventListener('click', async () => {
  const input = document.getElementById('input').value.trim();
  if (!input) return;
  const btn = document.getElementById('runBtn');
  btn.disabled = true;
  startTime = Date.now();

  document.getElementById('runStatus').textContent = 'Analyzing...';
  const logEl = document.getElementById('activityLog');
  logEl.innerHTML = '';
  document.getElementById('liveDot').classList.add('live');
  document.getElementById('verdictBar').classList.remove('visible','safe','danger');
  document.getElementById('activityPane').classList.add('visible');
  document.getElementById('resultPane').classList.remove('visible');
  document.getElementById('toggleActivity').classList.add('active');
  document.getElementById('toggleResult').classList.remove('active');

  log('mcp', 'Incoming tool call: <b>' + (activeTool === 'auto' ? 'Full Analysis (auto-detect)' : activeTool) + '</b> (' + input.length + ' chars)', '');

  try {
    const res = await fetch('${baseUrl}/api/stream', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tool: activeTool, document_text: input })
    });

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let finalData = null;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      const lines = buffer.split('\\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        try {
          const event = JSON.parse(line.slice(6));
          if (event.stage === 'final') {
            finalData = event.data;
            continue;
          }
          if (event.stage === 'error') {
            log('result', 'ERROR: ' + event.message, 'danger');
            continue;
          }

          const tagMap = { pipeline: 'mcp', extract: 'mcp', analysis: 'ai', tavily: 'verify', memory: 'memory', adversarial: 'verify', pattern: 'memory', frauddb: 'memory', synthesis: 'result', alert: 'alert', audit: 'audit', records: 'verify', 'audit-trail': 'memory' };
          const tag = tagMap[event.stage] || 'mcp';
          const cls = event.status === 'error' ? 'danger' : event.status === 'complete' ? 'success' : event.status === 'progress' ? '' : 'dim';
          log(tag, '<span style="opacity:0.5">[' + event.agent + ']</span> ' + event.message, cls);
          updateFacts(event);
        } catch {}
      }
    }

    if (finalData) {
      const vBar = document.getElementById('verdictBar');
      const totalTime = ((Date.now() - startTime) / 1000).toFixed(1);

      // Handle multi-analysis results
      let rs, agentCount;
      if (finalData.mode === 'multi' && finalData.analyses) {
        const allRisk = finalData.analyses.map(a => a.risk_synthesis).filter(Boolean);
        const highestRisk = allRisk.reduce((worst, r) => {
          const order = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
          return (order[r.risk_level] || 0) > (order[worst.risk_level] || 0) ? r : worst;
        }, allRisk[0] || { risk_level: 'LOW', composite_risk_score: 0, signals: [] });
        rs = highestRisk;
        agentCount = finalData.pipeline?.total_agents || 0;
      } else {
        rs = finalData.risk_synthesis;
        agentCount = finalData.pipeline?.agents_invoked?.length || 0;
      }

      vBar.classList.add('visible');
      if (rs && (rs.risk_level === 'CRITICAL' || rs.risk_level === 'HIGH')) {
        vBar.classList.add('danger');
        document.getElementById('verdictIcon').textContent = '\\u26A0\\uFE0F';
        document.getElementById('verdictText').textContent = 'RISK SCORE: ' + rs.composite_risk_score + '/100 (' + rs.risk_level + ')';
        document.getElementById('verdictSub').textContent = (finalData.mode === 'multi' ? finalData.analyses.length + ' docs | ' : '') + agentCount + ' agents | ' + totalTime + 's';
      } else if (rs && rs.risk_level === 'MEDIUM') {
        vBar.classList.add('danger');
        document.getElementById('verdictIcon').textContent = '\\u26A0\\uFE0F';
        document.getElementById('verdictText').textContent = 'RISK SCORE: ' + rs.composite_risk_score + '/100 (MEDIUM)';
        document.getElementById('verdictSub').textContent = (finalData.mode === 'multi' ? finalData.analyses.length + ' docs | ' : '') + agentCount + ' agents | ' + totalTime + 's';
      } else {
        vBar.classList.add('safe');
        document.getElementById('verdictIcon').textContent = '\\u2705';
        document.getElementById('verdictText').textContent = rs ? 'RISK SCORE: ' + rs.composite_risk_score + '/100 (LOW)' : 'ANALYSIS COMPLETE';
        document.getElementById('verdictSub').textContent = (finalData.mode === 'multi' ? finalData.analyses.length + ' docs | ' : '') + agentCount + ' agents | ' + totalTime + 's';
      }

      document.getElementById('resultPane').innerHTML = '<div class="result-json">' + syntaxHighlight(JSON.stringify(finalData, null, 2)) + '</div>';
    }

    document.getElementById('liveDot').classList.remove('live');
    document.getElementById('runStatus').textContent = '';
  } catch (e) {
    log('result', 'Stream failed: ' + e.message, 'danger');
    document.getElementById('liveDot').classList.remove('live');
    document.getElementById('runStatus').textContent = 'Error';
  }
  btn.disabled = false;
});

function renderDealSheet() {
  const fb = document.getElementById('factsBody');
  let html = '';

  // Property section
  html += '<div class="fact-group"><div class="fact-group-title">Property</div>';
  html += '<div class="fact-item ' + (deal.property.address ? 'new' : '') + '" data-field="address">' + (deal.property.address || '<span style="opacity:0.3">Pending...</span>') + '</div>';
  if (deal.property.apn) html += '<div class="fact-item new" data-field="apn">APN: ' + deal.property.apn + '</div>';
  html += '</div>';

  // Parties section
  html += '<div class="fact-group"><div class="fact-group-title">Parties</div>';
  if (deal.parties.buyers.length) deal.parties.buyers.forEach(b => { html += '<div class="fact-item new" data-field="buyer" data-entity="' + b.replace(/"/g,'') + '">Buyer: ' + b + '</div>'; });
  else html += '<div class="fact-item" data-field="buyer">Buyer: <span style="opacity:0.3">Pending...</span></div>';
  if (deal.parties.sellers.length) deal.parties.sellers.forEach(s => { html += '<div class="fact-item new" data-field="seller" data-entity="' + s.replace(/"/g,'') + '">Seller: ' + s + '</div>'; });
  else html += '<div class="fact-item" data-field="seller">Seller: <span style="opacity:0.3">Pending...</span></div>';
  if (deal.parties.lender) html += '<div class="fact-item new" data-field="lender">Lender: ' + deal.parties.lender + '</div>';
  html += '</div>';

  // Transaction section
  html += '<div class="fact-group"><div class="fact-group-title">Transaction</div>';
  if (deal.transaction.fileNumber) html += '<div class="fact-item new" data-field="file">File #: ' + deal.transaction.fileNumber + '</div>';
  if (deal.transaction.purchasePrice) html += '<div class="fact-item new" data-field="price">Purchase Price: ' + deal.transaction.purchasePrice + '</div>';
  if (deal.transaction.loanAmount) html += '<div class="fact-item new" data-field="loan">Loan Amount: ' + deal.transaction.loanAmount + '</div>';
  if (deal.transaction.cashToClose) html += '<div class="fact-item new" data-field="cash">Cash to Close: ' + deal.transaction.cashToClose + '</div>';
  if (deal.transaction.closingDate) html += '<div class="fact-item new" data-field="closing">Closing Date: ' + deal.transaction.closingDate + '</div>';
  if (!deal.transaction.fileNumber && !deal.transaction.purchasePrice) html += '<div class="fact-item"><span style="opacity:0.3">Awaiting transaction details...</span></div>';
  html += '</div>';

  // Title Company section
  html += '<div class="fact-group"><div class="fact-group-title">Title / Escrow</div>';
  if (deal.titleCompany.name) html += '<div class="fact-item new" data-field="title-co" data-entity="' + deal.titleCompany.name.replace(/"/g,'') + '">' + deal.titleCompany.name + '</div>';
  if (deal.titleCompany.officer) html += '<div class="fact-item new" data-field="officer">' + deal.titleCompany.officer + '</div>';
  if (deal.titleCompany.phone) html += '<div class="fact-item new" data-field="phone">' + deal.titleCompany.phone + '</div>';
  if (!deal.titleCompany.name) html += '<div class="fact-item"><span style="opacity:0.3">Pending...</span></div>';
  html += '</div>';

  // Lender / Loan section
  html += '<div class="fact-group"><div class="fact-group-title">Lender / Loan</div>';
  if (deal.loan.lender) html += '<div class="fact-item new" data-field="lender-name" data-entity="' + deal.loan.lender.replace(/"/g,'') + '">' + deal.loan.lender + '</div>';
  if (deal.loan.type) html += '<div class="fact-item new" data-field="loan-type">' + deal.loan.type + '</div>';
  if (deal.loan.amount) html += '<div class="fact-item new" data-field="loan-amt">Amount: ' + deal.loan.amount + '</div>';
  if (deal.loan.rate) html += '<div class="fact-item new" data-field="loan-rate">Rate: ' + deal.loan.rate + '</div>';
  if (!deal.loan.lender) html += '<div class="fact-item"><span style="opacity:0.3">Pending lender details...</span></div>';
  html += '</div>';

  // Milestone checklist
  html += '<div class="fact-group"><div class="fact-group-title">Closing Checklist</div>';
  const checks = [
    ['preQual', 'Pre-Qualification'],
    ['application', 'Loan Application'],
    ['appraisal', 'Appraisal'],
    ['titleSearch', 'Title Search'],
    ['underwriting', 'Underwriting'],
    ['conditionalApproval', 'Conditional Approval'],
    ['clearToClose', 'Clear to Close'],
    ['funded', 'Funded'],
  ];
  checks.forEach(([key, label]) => {
    const done = deal.milestones[key];
    html += '<div class="fact-item ' + (done ? 'verified' : '') + '" style="font-size:0.68rem;' + (done ? '' : 'opacity:0.5') + '">' + (done ? '\\u2713 ' : '\\u2003 ') + label + '</div>';
  });
  html += '</div>';

  // Wire section
  html += '<div class="fact-group"><div class="fact-group-title">Wire Instructions</div>';
  if (deal.wire.bank) html += '<div class="fact-item new" data-field="wire-bank" data-entity="' + deal.wire.bank.replace(/"/g,'') + '">Bank: ' + deal.wire.bank + '</div>';
  if (deal.wire.routing) html += '<div class="fact-item new" data-field="wire-routing" data-entity="' + deal.wire.routing + '">Routing: ' + deal.wire.routing + '</div>';
  if (deal.wire.beneficiary) html += '<div class="fact-item new" data-field="wire-beneficiary" data-entity="' + deal.wire.beneficiary.replace(/"/g,'') + '">Beneficiary: ' + deal.wire.beneficiary + '</div>';
  if (deal.wire.amount) html += '<div class="fact-item new" data-field="wire-amount" data-entity="' + deal.wire.amount + '">Amount: ' + deal.wire.amount + '</div>';
  if (!deal.wire.bank) html += '<div class="fact-item"><span style="opacity:0.3">No wire instructions yet...</span></div>';
  html += '</div>';

  // Flags section
  if (deal.flags.length) {
    html += '<div class="fact-group"><div class="fact-group-title" style="color:#f87171">Flags (' + deal.flags.length + ')</div>';
    deal.flags.forEach(f => { html += '<div class="fact-item mismatch">' + f + '</div>'; });
    html += '</div>';
  }

  fb.innerHTML = html;
}

function extractDealInfo(text) {
  // Pull structured deal info from document text
  const fileMatch = text.match(/File\\s*(?:No|#|Number)?:?\\s*([\\w-]+)/i);
  if (fileMatch) deal.transaction.fileNumber = fileMatch[1];

  const closingMatch = text.match(/Closing\\s*Date:?\\s*([\\w\\s,]+\\d{4})/i);
  if (closingMatch) deal.transaction.closingDate = closingMatch[1].trim();

  const propertyMatch = text.match(/Property(?:\\s*Address)?:?\\s*([\\d]+[^\\n]{10,})/i);
  if (propertyMatch && !deal.property.address) deal.property.address = propertyMatch[1].trim();

  const apnMatch = text.match(/APN:?\\s*([\\d-]+)/i);
  if (apnMatch) deal.property.apn = apnMatch[1];

  const buyerMatch = text.match(/(?:Proposed\\s*Insured|BORROWER|Buyer|Grantee):?\\s*(.+?)(?:\\n|$)/i);
  if (buyerMatch) {
    const buyer = buyerMatch[1].trim().replace(/,?\\s*(?:husband and wife|as community property|as joint tenants).*$/i, '').trim();
    if (buyer && !deal.parties.buyers.includes(buyer)) deal.parties.buyers.push(buyer);
  }

  const sellerMatch = text.match(/(?:SELLER|Title\\s*Vested\\s*In|Grantor|OWNER):?\\s*(.+?)(?:\\n|$)/i);
  if (sellerMatch) {
    const seller = sellerMatch[1].trim();
    if (seller && !deal.parties.sellers.includes(seller)) deal.parties.sellers.push(seller);
  }

  const lenderMatch = text.match(/(?:LENDER|Lender):?\\s*(.+?)(?:\\n|$)/i);
  if (lenderMatch) {
    deal.parties.lender = lenderMatch[1].trim();
    deal.loan.lender = lenderMatch[1].trim();
  }

  // Loan details
  const loanTypeMatch = text.match(/(\\d+[- ]Year\\s+Fixed|ARM|Adjustable|FHA|VA|Conventional|Jumbo)/i);
  if (loanTypeMatch) deal.loan.type = loanTypeMatch[1];

  const rateMatch = text.match(/Interest\\s*Rate:?\\s*([\\d.]+%)/i);
  if (rateMatch) deal.loan.rate = rateMatch[1];

  const termMatch = text.match(/(\\d+)[- ]Year/i);
  if (termMatch) deal.loan.term = termMatch[1] + ' years';

  const priceMatch = text.match(/Purchase\\s*Price:?\\s*(\\$[\\d,.]+)/i);
  if (priceMatch) deal.transaction.purchasePrice = priceMatch[1];

  const loanMatch = text.match(/Loan\\s*Amount:?\\s*(\\$[\\d,.]+)/i);
  if (loanMatch) { deal.transaction.loanAmount = loanMatch[1]; deal.loan.amount = loanMatch[1]; }

  const cashMatch = text.match(/(?:TOTAL\\s*)?Cash\\s*to\\s*Close:?\\s*(\\$[\\d,.]+)/i);
  if (cashMatch) deal.transaction.cashToClose = cashMatch[1];

  const titleCoMatch = text.match(/(?:Settlement\\s*Agent|Prepared\\s*by|To):?\\s*((?:Meridian|First\\s*American|Chicago|Fidelity|Old\\s*Republic|Stewart)[^\\n]*)/i);
  if (titleCoMatch && !deal.titleCompany.name) deal.titleCompany.name = titleCoMatch[1].trim().replace(/,?\\s*Inc\\.?$/, ' Inc.');

  const officerMatch = text.match(/(?:Escrow\\s*Officer|Title\\s*Officer):?\\s*(.+?)(?:\\n|$)/i);
  if (officerMatch) deal.titleCompany.officer = officerMatch[1].trim();

  const phoneMatch = text.match(/(?:Direct|Phone|Tel):?\\s*([\\(\\)\\d\\s.-]+(?:ext\\.?\\s*\\d+)?)/i);
  if (phoneMatch) deal.titleCompany.phone = phoneMatch[1].trim();

  // Wire details
  const bankMatch = text.match(/Bank:?\\s*(.+?)(?:\\n|$)/i);
  if (bankMatch) deal.wire.bank = bankMatch[1].trim();

  const routingMatch = text.match(/Routing:?\\s*(\\d{9})/i);
  if (routingMatch) deal.wire.routing = routingMatch[1];

  const beneficiaryMatch = text.match(/Beneficiary:?\\s*(.+?)(?:\\n|$)/i);
  if (beneficiaryMatch) deal.wire.beneficiary = beneficiaryMatch[1].trim();

  const amountMatch = text.match(/Amount:?\\s*(\\$[\\d,.]+)/i);
  if (amountMatch) deal.wire.amount = amountMatch[1];

  // Auto-check milestones based on document content
  if (deal.loan.lender || deal.loan.amount) {
    deal.milestones.preQual = true;
    deal.milestones.application = true;
  }
  if (text.match(/apprais/i) || deal.transaction.purchasePrice) {
    deal.milestones.appraisal = true;
  }
  if (activeTool === 'analyze_commitment' || text.match(/COMMITMENT FOR TITLE/i) || text.match(/SCHEDULE B/i)) {
    deal.milestones.titleSearch = true;
  }
  if (deal.loan.lender && deal.transaction.loanAmount) {
    deal.milestones.underwriting = true;
  }
  if (activeTool === 'analyze_closing_disclosure' || text.match(/CLOSING DISCLOSURE/i)) {
    deal.milestones.conditionalApproval = true;
    deal.milestones.clearToClose = true;
  }
  if (deal.wire.bank && deal.wire.routing && deal.transaction.cashToClose) {
    deal.milestones.funded = false; // Only true after successful wire verification
  }
}

function updateFacts(event) {
  const fb = document.getElementById('factsBody');
  // On extraction, update deal sheet
  if (event.stage === 'extract' && event.status === 'complete' && event.data) {
    const d = event.data;
    d.beneficiaries?.forEach(b => { if (!deal.rawEntities.beneficiaries.includes(b)) deal.rawEntities.beneficiaries.push(b); });
    d.routingNumbers?.forEach(r => { if (!deal.rawEntities.routingNumbers.includes(r)) deal.rawEntities.routingNumbers.push(r); });
    d.banks?.forEach(b => { if (!deal.rawEntities.banks.includes(b)) deal.rawEntities.banks.push(b); });
    d.amounts?.forEach(a => { if (!deal.rawEntities.amounts.includes(a)) deal.rawEntities.amounts.push(a); });
    d.addresses?.forEach(a => { if (!deal.rawEntities.addresses.includes(a)) deal.rawEntities.addresses.push(a); });
    // Also extract structured deal info from document text
    extractDealInfo(document.getElementById('input').value);
    if (activeTool !== 'auto') {
      if (!deal.documentsReceived.includes(activeTool)) deal.documentsReceived.push(activeTool);
    }
    docCount++;
    document.getElementById('docCount').textContent = docCount + ' doc' + (docCount === 1 ? '' : 's');
    renderDealSheet();
  }
  // Mark verified/unverified from Tavily
  if (event.stage === 'tavily' && event.status === 'progress' && event.data) {
    const v = event.data;
    const items = fb.querySelectorAll('.fact-item');
    items.forEach(item => {
      const entity = item.getAttribute('data-entity') || '';
      if (v.entity && entity && (entity.includes(v.entity.split(' (')[0]) || v.entity.includes(entity.split(' (')[0]))) {
        item.classList.remove('new');
        item.classList.add(v.verified ? 'verified' : 'unverified');
        if (!v.verified && !item.innerHTML.includes('UNVERIFIED')) item.innerHTML += ' <span style="color:#f87171;font-size:0.55rem;font-weight:600">UNVERIFIED</span>';
        else if (v.verified && !item.innerHTML.includes('VERIFIED')) item.innerHTML += ' <span style="color:#4ade80;font-size:0.55rem;font-weight:600">VERIFIED</span>';
      }
    });
  }
  // Flag audit mismatches
  if (event.stage === 'audit' && event.status === 'progress' && event.data?.field) {
    const d = event.data;
    deal.flags.push(d.field.replace(/_/g,' ') + ': "' + d.current_value + '" vs "' + d.prior_value + '" (' + d.prior_document + ')');
    const items = fb.querySelectorAll('.fact-item');
    items.forEach(item => {
      const entity = item.getAttribute('data-entity') || '';
      if (entity && (entity.includes(d.current_value) || d.current_value.includes(entity.substring(0, 8)))) {
        item.classList.remove('new', 'verified');
        item.classList.add('mismatch');
        if (!item.innerHTML.includes('MISMATCH')) item.innerHTML += ' <span style="color:#fca5a5;font-size:0.55rem;font-weight:600">MISMATCH</span>';
      }
    });
    renderDealSheet();
  }
  // Update agent count and check deal completion
  if (event.stage === 'pipeline' && event.status === 'complete') {
    const match = event.message.match(/(\\d+) agents/);
    if (match) document.getElementById('agentCountDisplay').textContent = match[1];
    updateDealStatus();
  }
}

function updateDealStatus() {
  const statusEl = document.getElementById('dealStatus');
  const labelEl = document.getElementById('dealStatusLabel');
  const subEl = document.getElementById('dealStatusSub');
  const actionsEl = document.getElementById('dealActions');

  const checkedCount = Object.values(deal.milestones).filter(Boolean).length;
  const totalChecks = Object.keys(deal.milestones).length;
  const hasFlags = deal.flags.length > 0;
  const hasCriticalInfo = deal.property.address && deal.parties.buyers.length && deal.titleCompany.name;

  if (deal.archived) {
    statusEl.className = 'deal-status archived';
    labelEl.textContent = 'ARCHIVED — AUDIT READY';
    subEl.textContent = 'File compressed and stored in deep storage. Compliant for regulatory audit.';
    actionsEl.style.display = 'flex';
    actionsEl.innerHTML = '<button class="deal-action-btn" style="border-color:#64748b;background:#64748b20;color:#94a3b8;cursor:default">File #' + (deal.transaction.fileNumber || 'N/A') + ' — Archived ' + new Date().toLocaleDateString() + '</button>';
  } else if (hasFlags) {
    statusEl.className = 'deal-status hold';
    labelEl.textContent = 'HOLD — DISCREPANCY DETECTED';
    subEl.textContent = deal.flags.length + ' inconsistenc' + (deal.flags.length === 1 ? 'y' : 'ies') + ' found across documents. Do not proceed.';
    actionsEl.style.display = 'flex';
    actionsEl.innerHTML = '<button class="deal-action-btn danger" onclick="sendNotification(\\'hold_all_parties\\', \\'both\\')">Notify All Parties — HOLD</button><button class="deal-action-btn danger" onclick="sendNotification(\\'escalate_compliance\\', \\'sms\\')">Escalate to Compliance</button>';
  } else if (checkedCount >= 6 && hasCriticalInfo && deal.wire.routing) {
    statusEl.className = 'deal-status ready';
    labelEl.textContent = 'READY TO CLOSE';
    subEl.textContent = checkedCount + '/' + totalChecks + ' milestones complete. All documents verified. No discrepancies.';
    actionsEl.style.display = 'flex';
    actionsEl.innerHTML = '<button class="deal-action-btn" onclick="sendNotification(\\'notify_buyer_agent\\', \\'sms\\')">Notify Buyer\\'s Agent</button><button class="deal-action-btn" onclick="sendNotification(\\'notify_seller_agent\\', \\'sms\\')">Notify Seller\\'s Agent</button><button class="deal-action-btn" onclick="sendNotification(\\'send_to_lender\\', \\'sms\\')">Text Lender</button><button class="deal-action-btn" style="border-color:#8b5cf6;background:#8b5cf620;color:#c4b5fd" onclick="archiveDeal()">Archive for Compliance</button>';
  } else if (docCount > 0) {
    statusEl.className = 'deal-status in-progress';
    labelEl.textContent = 'IN PROGRESS — ' + checkedCount + '/' + totalChecks + ' COMPLETE';
    subEl.textContent = 'Continue submitting documents to build the deal file.';
    actionsEl.style.display = 'none';
  }
}

function syntaxHighlight(json) {
  return json.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
    .replace(/"([^"]+)":/g, '<span class="key">"$1"</span>:')
    .replace(/: "([^"]*)"/g, ': <span class="string">"$1"</span>')
    .replace(/: (\\d+\\.?\\d*)/g, ': <span class="number">$1</span>')
    .replace(/: (true|false|null)/g, ': <span class="bool">$1</span>');
}

async function sendNotification(action, mode) {
  const toast = document.createElement('div');
  toast.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:#0f172a;border:2px solid ' + (mode === 'voice' ? '#8b5cf6' : '#2563eb') + ';border-radius:12px;padding:2rem;z-index:9999;min-width:340px;text-align:center;box-shadow:0 20px 60px rgba(0,0,0,0.8)';
  const icon = mode === 'voice' ? '\\u{1F4DE}' : '\\u{1F4F1}';
  const modeLabel = mode === 'voice' ? 'Placing voice call...' : mode === 'both' ? 'Sending SMS + calling...' : 'Sending SMS...';
  toast.innerHTML = '<div style="font-size:2rem;margin-bottom:0.75rem">' + icon + '</div><div style="color:#fff;font-size:0.9rem;font-weight:600;margin-bottom:0.5rem">Closing Coordinator</div><div style="color:#94a3b8;font-size:0.8rem" id="notifyStatus">' + modeLabel + '</div><div style="margin-top:1rem;height:3px;background:#1e293b;border-radius:2px;overflow:hidden"><div style="height:100%;width:0%;background:' + (mode === 'voice' ? '#8b5cf6' : '#3b82f6') + ';border-radius:2px;animation:notifyProgress 3s ease-in-out forwards" id="notifyBar"></div></div>';
  document.body.appendChild(toast);

  const overlay = document.createElement('div');
  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.6);z-index:9998';
  document.body.appendChild(overlay);

  log('mcp', '<span style="opacity:0.5">[Closing Coordinator]</span> Initiating ' + mode + ' notification: <b>' + action.replace(/_/g, ' ') + '</b>', '');

  try {
    const res = await fetch('/api/notify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action,
        mode,
        dealInfo: {
          property: deal.property.address || 'Unknown',
          fileNumber: deal.transaction.fileNumber || 'N/A',
          buyers: deal.parties.buyers,
          sellers: deal.parties.sellers,
          status: deal.flags.length > 0 ? 'hold' : 'ready',
          flags: deal.flags,
        }
      })
    });
    const data = await res.json();
    const statusEl = document.getElementById('notifyStatus');
    if (data.success && !data.simulated) {
      statusEl.innerHTML = '<span style="color:#4ade80;font-weight:600">Sent!</span><br><span style="font-size:0.7rem">' + (data.message || '') + '</span>';
      log('result', '<span style="opacity:0.5">[Closing Coordinator]</span> ' + (data.message || 'Notification sent'), 'success');
    } else if (data.simulated) {
      statusEl.innerHTML = '<span style="color:#fbbf24;font-weight:600">Demo Mode</span><br><span style="font-size:0.7rem">' + (data.message || 'Telnyx not configured') + '</span>';
      log('mcp', '<span style="opacity:0.5">[Closing Coordinator]</span> ' + (data.message || 'Simulated — configure Telnyx for live notifications'), 'warn');
    } else {
      statusEl.innerHTML = '<span style="color:#f87171">Failed: ' + (data.error || 'Unknown error') + '</span>';
      log('result', '<span style="opacity:0.5">[Closing Coordinator]</span> Notification failed: ' + (data.error || ''), 'danger');
    }
  } catch (e) {
    document.getElementById('notifyStatus').innerHTML = '<span style="color:#f87171">Network error</span>';
    log('result', '<span style="opacity:0.5">[Closing Coordinator]</span> Network error: ' + e.message, 'danger');
  }

  setTimeout(() => { toast.remove(); overlay.remove(); }, 4000);
}

async function archiveDeal() {
  const toast = document.createElement('div');
  toast.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:#0f172a;border:2px solid #8b5cf6;border-radius:12px;padding:2rem;z-index:9999;min-width:400px;text-align:left;box-shadow:0 20px 60px rgba(0,0,0,0.8);max-height:80vh;overflow-y:auto';
  const overlay = document.createElement('div');
  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.6);z-index:9998';
  document.body.appendChild(overlay);
  document.body.appendChild(toast);

  log('mcp', '<span style="opacity:0.5">[Compliance Archiver]</span> Initiating post-closing compliance archive...', '');

  // Step 1: Check document presence
  toast.innerHTML = '<div style="color:#fff;font-size:1rem;font-weight:700;margin-bottom:1rem">Post-Closing Compliance Archive</div><div style="color:#94a3b8;font-size:0.75rem;margin-bottom:1rem">Verifying document presence...</div><div id="archiveChecklist"></div>';

  const checklist = document.getElementById('archiveChecklist');
  let missingDocs = [];
  let presentDocs = [];

  await delay(600);

  for (const doc of REQUIRED_CLOSING_DOCS) {
    await delay(300);
    const isPresent = doc.tools.length === 0
      ? false  // Non-analyzable docs (deed, survey, etc.) require manual upload
      : deal.documentsReceived.some(d => doc.tools.includes(d));

    const item = document.createElement('div');
    item.style.cssText = 'display:flex;align-items:center;gap:0.5rem;padding:0.35rem 0;font-size:0.75rem;border-bottom:1px solid #1e293b;animation:fadeIn 0.3s forwards';

    if (isPresent) {
      item.innerHTML = '<span style="color:#4ade80;font-size:0.85rem">\\u2713</span><span style="color:#e2e8f0">' + doc.label + '</span><span style="margin-left:auto;color:#4ade80;font-size:0.6rem;font-weight:600">PRESENT</span>';
      presentDocs.push(doc.key);
      log('memory', '<span style="opacity:0.5">[Compliance Archiver]</span> \\u2713 ' + doc.label + ' — present and verified', 'success');
    } else {
      item.innerHTML = '<span style="color:#fbbf24;font-size:0.85rem">\\u26A0</span><span style="color:#e2e8f0">' + doc.label + '</span><span style="margin-left:auto;color:#fbbf24;font-size:0.6rem;font-weight:600">MISSING</span>';
      missingDocs.push(doc.label);
      log('memory', '<span style="opacity:0.5">[Compliance Archiver]</span> \\u26A0 ' + doc.label + ' — NOT in file', 'warn');
    }
    checklist.appendChild(item);
  }

  await delay(500);

  // Step 2: Summary and archive action
  const summary = document.createElement('div');
  summary.style.cssText = 'margin-top:1rem;padding-top:0.75rem;border-top:1px solid #334155';

  if (missingDocs.length > 0) {
    summary.innerHTML = '<div style="color:#fbbf24;font-size:0.8rem;font-weight:600;margin-bottom:0.5rem">\\u26A0 ' + missingDocs.length + ' document(s) missing from file</div><div style="color:#94a3b8;font-size:0.7rem;margin-bottom:0.75rem">Archiving with gaps noted. Auditor will see deficiency flags.</div><div style="display:flex;gap:0.5rem"><button onclick="completeArchive(' + missingDocs.length + ')" style="padding:0.4rem 1rem;background:#8b5cf6;color:#fff;border:none;border-radius:6px;font-size:0.75rem;font-weight:600;cursor:pointer">Archive Anyway (flag gaps)</button><button onclick="closeArchiveModal()" style="padding:0.4rem 1rem;background:transparent;border:1px solid #475569;color:#94a3b8;border-radius:6px;font-size:0.75rem;cursor:pointer">Cancel</button></div>';
    log('mcp', '<span style="opacity:0.5">[Compliance Archiver]</span> ' + presentDocs.length + '/' + REQUIRED_CLOSING_DOCS.length + ' documents present. ' + missingDocs.length + ' gaps flagged.', 'warn');
  } else {
    summary.innerHTML = '<div style="color:#4ade80;font-size:0.8rem;font-weight:600;margin-bottom:0.5rem">\\u2713 All required documents present</div><div style="color:#94a3b8;font-size:0.7rem;margin-bottom:0.75rem">File is complete. Ready for compression and deep storage.</div><div style="display:flex;gap:0.5rem"><button onclick="completeArchive(0)" style="padding:0.4rem 1rem;background:#8b5cf6;color:#fff;border:none;border-radius:6px;font-size:0.75rem;font-weight:600;cursor:pointer">Compress & Archive to R2</button><button onclick="closeArchiveModal()" style="padding:0.4rem 1rem;background:transparent;border:1px solid #475569;color:#94a3b8;border-radius:6px;font-size:0.75rem;cursor:pointer">Close</button></div>';
    log('mcp', '<span style="opacity:0.5">[Compliance Archiver]</span> All ' + REQUIRED_CLOSING_DOCS.length + ' required documents present. File complete.', 'success');
  }
  checklist.appendChild(summary);
}

async function completeArchive(gaps) {
  log('memory', '<span style="opacity:0.5">[Compliance Archiver]</span> Compressing deal file...', '');
  await delay(800);
  log('memory', '<span style="opacity:0.5">[Compliance Archiver]</span> Writing compliance manifest (file #, dates, agent decisions, risk scores)...', '');
  await delay(600);
  log('memory', '<span style="opacity:0.5">[Compliance Archiver]</span> Storing to Cloudflare R2 deep storage: /' + (deal.transaction.fileNumber || 'deal') + '/archive.bundle', '');
  await delay(500);

  if (gaps > 0) {
    log('memory', '<span style="opacity:0.5">[Compliance Archiver]</span> Deficiency flags attached: ' + gaps + ' missing document(s) noted in manifest', 'warn');
  }

  log('result', '<span style="opacity:0.5">[Compliance Archiver]</span> Archive complete. File stored with full audit trail. Retention: 7 years per RESPA/TILA.', 'success');

  deal.archived = true;
  updateDealStatus();

  // Remove overlay
  closeArchiveModal();
}

function closeArchiveModal() {
  document.querySelectorAll('[style*="z-index:9998"]').forEach(el => el.remove());
  document.querySelectorAll('[style*="z-index:9999"]').forEach(el => el.remove());
}
</script>
</body>
</html>`;
}

function demoPageHTML(): string {
  const sampleInput = `WIRE TRANSFER INSTRUCTIONS
To: First American Title Insurance Company
Bank: Chase Bank NA
Routing: 021000021
Account: 483729105
Beneficiary: First American Title - Escrow
Amount: $427,500.00
Reference: File #2024-SF-08812

Please wire funds no later than 48 hours prior to closing.
Contact: Sarah Chen, Escrow Officer
Phone: (415) 555-0142`;

  const sampleOutput = {
    analysis: {
      bankInformation: {
        bankName: "Chase Bank NA",
        routingNumber: "021000021",
        accountNumber: "483729105",
        routingValid: true,
        bankVerified: "Chase Bank NA matches routing 021000021 (JPMorgan Chase, NYC)"
      },
      beneficiary: {
        name: "First American Title - Escrow",
        matchesExpected: true,
        isKnownTitleCompany: true
      },
      amount: "$427,500.00",
      verification: {
        riskLevel: "LOW",
        confidence: 0.94,
        checks_passed: 7,
        checks_total: 8
      },
      fraudIndicators: {
        detected: false,
        flags: [],
        note: "All indicators consistent with legitimate title company escrow instructions"
      },
      recommendations: [
        "Verify phone number (415) 555-0142 independently — do not use contact info from this document",
        "Confirm file reference #2024-SF-08812 matches your closing documents",
        "Call First American Title directly using number from their website to confirm account"
      ]
    },
    adversarial_verification: {
      verified: true,
      independent_conclusion: "AGREE - No fraud indicators detected",
      dissent: null,
      confidence: 0.92,
      method: "Independent AI re-analyzed document without seeing primary analysis"
    }
  };

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>TitleWise Demo — Sample Output</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#0a0a0f;color:#e4e4e7;min-height:100vh;padding:2rem}
.container{max-width:800px;margin:0 auto}
h1{font-size:1.5rem;color:#fff;margin-bottom:0.25rem}
.subtitle{color:#94a3b8;margin-bottom:2rem}
.columns{display:grid;grid-template-columns:1fr 1fr;gap:1.25rem;margin-bottom:1.5rem}
@media(max-width:700px){.columns{grid-template-columns:1fr}}
.col-header{font-size:0.75rem;text-transform:uppercase;letter-spacing:0.05em;color:#64748b;margin-bottom:0.5rem;font-weight:600}
.input-box{background:#111827;border:1px solid #1f2937;border-radius:8px;padding:1rem;font-family:monospace;font-size:0.75rem;line-height:1.6;color:#94a3b8;white-space:pre-wrap}
.output-box{background:#09090b;border:1px solid #27272a;border-radius:8px;padding:1rem;font-family:monospace;font-size:0.7rem;line-height:1.5;color:#e2e8f0;white-space:pre-wrap;overflow-x:auto;max-height:500px;overflow-y:auto}
.verdict{display:inline-flex;align-items:center;gap:0.5rem;background:#052e16;border:1px solid #166534;border-radius:8px;padding:0.75rem 1.25rem;margin-bottom:1.5rem}
.verdict-dot{width:10px;height:10px;border-radius:50%;background:#4ade80}
.verdict-text{color:#4ade80;font-weight:600;font-size:0.9rem}
.verdict-sub{color:#86efac;font-size:0.8rem;margin-left:0.5rem}
.note{background:#1e293b;border-radius:8px;padding:1rem;color:#94a3b8;font-size:0.85rem;line-height:1.5;margin-bottom:1.5rem}
.note strong{color:#e2e8f0}
a{color:#60a5fa;text-decoration:none}
a:hover{text-decoration:underline}
.back{margin-top:1.5rem;padding-top:1rem;border-top:1px solid #27272a}
</style>
</head>
<body>
<div class="container">
  <h1>Sample: Wire Fraud Detection</h1>
  <p class="subtitle">What happens when an agent calls <code style="background:#27272a;padding:0.15rem 0.4rem;border-radius:3px;font-size:0.8rem">verify_wire</code></p>

  <div class="verdict">
    <div class="verdict-dot"></div>
    <span class="verdict-text">SAFE</span>
    <span class="verdict-sub">Adversarially verified by independent AI</span>
  </div>

  <div class="note">
    <strong>What you're seeing:</strong> An agent sent wire transfer instructions. TitleWise analyzed them for fraud indicators, verified the routing number, checked the beneficiary against known title companies, then a <em>completely independent second AI</em> re-analyzed the document without seeing the first result. Both agreed: legitimate.
  </div>

  <div class="columns">
    <div>
      <div class="col-header">Input (wire instructions)</div>
      <div class="input-box">${sampleInput}</div>
    </div>
    <div>
      <div class="col-header">Output (structured analysis)</div>
      <div class="output-box">${JSON.stringify(sampleOutput, null, 2)}</div>
    </div>
  </div>

  <div class="note">
    <strong>Adversarial Verification:</strong> Wire fraud is safety-critical. A wrong answer means someone loses their life savings. So every wire check is independently re-analyzed by a second AI that never sees the first analysis. If they disagree, the transaction is flagged for human review. This is not a second opinion — it's an adversarial challenge.
  </div>

  <div class="back">
    <a href="/">&larr; Back to gateway</a>
  </div>
</div>
</body>
</html>`;
}

interface BlogPost {
  slug: string;
  title: string;
  description: string;
  date: string;
  author: string;
  authorUrl: string;
  category: string;
  readTime: string;
  body: string;
  canonical?: string;
}

const BLOG_POSTS: BlogPost[] = [
  {
    slug: "what-can-ai-automate-title-review",
    title: "What Parts of Title Review Can AI Actually Automate, and What Still Requires a Closing Attorney?",
    description: "The distinction between pattern work and judgment work in title examination, and why that line determines exactly where AI helps and where the attorney remains essential.",
    date: "July 17, 2026",
    author: "Patrick Mitchell",
    authorUrl: "https://linkedin.com/in/patricktmitchell",
    category: "Real Estate / Legal",
    readTime: "6 min read",
    canonical: "https://titlewise.app/blog/what-can-ai-automate-title-review",
    body: `<p>The question comes up constantly right now. Closing attorneys are watching AI tools get pitched at them from every direction, and most of them are skeptical for good reason. They've seen software promise to simplify title work before.</p>

<p>But there's a real distinction worth making here. Not all of what attorneys do in title review is the same kind of work.</p>

<h2>Pattern Work vs. Judgment Work</h2>

<p>Title examination takes time mostly because it involves checking the same fields on the same document types, looking for the same problems. Is the grantor name consistent with the prior deed? Does the legal description match? Are there open liens that should have been released? Is there a gap in the chain?</p>

<p>That work is pattern-based. It doesn't require legal training to execute, only legal training to define. Once you know what to look for and what counts as a problem, the actual checking is mechanical.</p>

<p>The attorney's value isn't in doing the mechanical checking. It's in knowing what to do when the mechanical check finds something, and in exercising judgment about risk, exceptions, and client advice.</p>

<p>That's the line. Pattern work is AI territory. Judgment work is attorney territory.</p>

<h2>What AI Can Handle</h2>

<p>Title commitments follow a standard structure. Schedule A has the property and transaction basics. Schedule B-I lists requirements. Schedule B-II lists exceptions. An AI system that understands these structures can scan a commitment and flag anything that looks off: missing requirements, exceptions that appear unusual, coverage gaps, inconsistencies between the insured amount and the purchase price.</p>

<p>Closing disclosures and HUD-1s are similar. The fields are defined. The relationships between fields are defined. Checking whether a disbursement line matches its referenced payoff statement, or whether a fee is disclosed correctly, is something AI can do faster and more consistently than a paralegal running down a checklist manually.</p>

<p>Deed review is another area where the pattern work is clear. Does the legal description in the deed match the legal description in the commitment? Is the grantor on the deed the same party that held title in the prior conveyance? Are signature and notarization blocks complete? These are checks with defined right answers, and missing one because of volume or fatigue is a real risk in a busy practice.</p>

<p>Chain of title gaps are findable through document sequencing. If the title plant shows a conveyance from Smith to Jones in 2004, and the next recorded instrument has Jones conveying to Peterson in 2019, an AI system can flag that gap and surface it for review. It doesn't need to know why the gap exists. It just needs to know it does.</p>

<p>Lien and encumbrance cross-referencing works the same way. If a mortgage appears in Schedule B-I as a requirement for payoff but doesn't appear in the disbursement schedule, that's a discrepancy. Finding discrepancies is pattern work.</p>

<p>Across these document types, the volume of this kind of checking adds up. For most closings, attorneys and their staff spend four or more hours on pattern-based review that could be done in seconds by a system built to do it.</p>

<h2>What Still Requires the Attorney</h2>

<p>Finding a problem is different from knowing what to do about it.</p>

<p>An exception flagged in Schedule B-II might be standard survey language, or it might affect the property in a material way depending on what the client plans to do with it. An AI system can flag the exception. Deciding whether it matters for this client and this transaction is a legal judgment.</p>

<p>Unusual easements and restrictions require interpretation. An access easement running across the back of the property means something different if the client is building a garage than if they're leaving it as a vacation home. Reading the instrument, understanding its scope, and advising the client on its implications, that's attorney work.</p>

<p>Title defects need legal analysis. If there's a break in the chain, someone has to evaluate whether it's curable, how to cure it, what the risk is if it isn't cured, and whether to insure over it or hold the closing. That's not a checklist item. It requires judgment about local title law, the underwriter's guidelines, and the specific facts of the transaction.</p>

<p>The certification is the attorney's act. When a closing attorney certifies title, they're signing off that they've examined the record and formed a professional opinion. AI can't make that certification and shouldn't. The attorney is the one with the license, the professional obligation, and the accountability.</p>

<p>Anything involving client advice follows the same logic. What does this restriction mean for their plans? Should they accept this exception or negotiate it out? What's the risk of proceeding with this lien unresolved? Those conversations require a lawyer, not a pattern-matching system.</p>

<h2>The Practical Split</h2>

<p>If you take the volume of work in a typical title examination and split it between pattern work and judgment work, the pattern side is most of it by time. Not the most important part, just the most time-consuming.</p>

<p>That matters. It means attorneys are spending the bulk of their time on work that doesn't require their expertise, while the work that actually needs them, the interpretation, the exceptions, the client counsel, gets whatever time is left after the mechanical checking is done.</p>

<p>AI shifts that balance. The pattern checking happens in seconds. What requires the attorney surfaces directly, without the hours of routine review before it.</p>

<p>For a busy practice running twenty or thirty closings a month, that's not a small change. It's the difference between title review being a bottleneck and it being something that gets handled efficiently at every stage.</p>

<h2>How TitleWise Fits</h2>

<p>TitleWise handles the pattern work across seven document types: title commitments, closing disclosures, HUD-1s, deeds, title plants, lien searches, and surveys. It checks the fields, finds the inconsistencies, and flags what needs a closer look.</p>

<p>What comes out the other side is a set of exceptions, discrepancies, and items that need the attorney's judgment. The mechanical work is already done. The attorney focuses on what they were trained to do, which is the 10 to 15 percent of each file that actually requires them.</p>

<p>That's not replacing closing attorneys. It's removing the part of the job that was consuming most of their time without requiring any of their expertise.</p>`,
  },
];

const BLOG_FAQ_HTML = `
<div class="faq-section">
  <div class="faq-inner">
    <h2 style="font-size:clamp(1.5rem,3vw,2rem);font-weight:800;letter-spacing:-0.03em;color:var(--text);margin-bottom:40px">Frequently asked questions</h2>
    <div class="faq-item">
      <div class="faq-q" onclick="toggleFaq(this)"><h3>What is TitleWise?</h3><span class="arrow">+</span></div>
      <div class="faq-a"><p>TitleWise is an AI-powered closing platform built specifically for real estate attorneys. It combines document analysis tools, wire fraud protection, TRID compliance checks, and an autonomous closing coordinator — so you can close faster with fewer errors.</p></div>
    </div>
    <div class="faq-item">
      <div class="faq-q" onclick="toggleFaq(this)"><h3>How is TitleWise different from Qualia or SoftPro?</h3><span class="arrow">+</span></div>
      <div class="faq-a"><p>Qualia, SoftPro, and similar platforms manage the production pipeline: escrow, title orders, scheduling, and closing workflow. They are not built to review documents. TitleWise is specifically built for examination intelligence — analyzing the content of title commitments, CDs, and other documents for issues that require attorney attention. The two categories solve different problems.</p></div>
    </div>
    <div class="faq-item">
      <div class="faq-q" onclick="toggleFaq(this)"><h3>How accurate is AI for reviewing closing documents?</h3><span class="arrow">+</span></div>
      <div class="faq-a"><p>For pattern-based review — detecting missing fields, flagging standard exceptions, identifying inconsistencies between documents — AI is highly reliable. For judgment calls that require legal interpretation, the attorney stays in the loop. TitleWise handles the former and surfaces the latter.</p></div>
    </div>
    <div class="faq-item">
      <div class="faq-q" onclick="toggleFaq(this)"><h3>Is my client data secure?</h3><span class="arrow">+</span></div>
      <div class="faq-a"><p>Yes. All data is encrypted in transit and at rest. Documents are processed to generate analysis for your matter only — never used to train AI models or shared with any third party.</p></div>
    </div>
    <div class="faq-item">
      <div class="faq-q" onclick="toggleFaq(this)"><h3>Which tools are included?</h3><span class="arrow">+</span></div>
      <div class="faq-a"><p>Wire Fraud Verification, Title Commitment Analysis, Closing Disclosure Review, HOA Document Review, Fee Estimate Generator, Tax Proration Calculator, Status Update Generator, Deal Memory, and the Autonomous Closing Agent. All included in every plan.</p></div>
    </div>
    <div class="faq-item">
      <div class="faq-q" onclick="toggleFaq(this)"><h3>Will AI replace title attorneys?</h3><span class="arrow">+</span></div>
      <div class="faq-a"><p>No. AI handles the repetitive, rules-based layer of title examination. The judgment work — evaluating risk, interpreting unusual easements, certifying title, advising clients — requires legal expertise and professional responsibility that no AI can substitute. TitleWise makes attorneys more productive, not replaceable.</p></div>
    </div>
  </div>
</div>`;

const BLOG_FOOTER_HTML = `
<footer>
  <div class="footer-inner">
    <div class="footer-grid">
      <div>
        <div class="footer-brand">
          <svg height="22" viewBox="0 0 36 43" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="10" y="0" width="24" height="32" rx="4" fill="var(--logo-back, #3b82f6)"/>
            <rect x="2" y="8" width="24" height="32" rx="4" fill="var(--logo-front, #EDEEF0)"/>
          </svg>
          <span style="font-size:1rem;line-height:1"><b style="font-weight:700;color:var(--text);letter-spacing:-0.01em">TITLE</b><span style="font-weight:300;color:var(--muted)">wise</span></span>
        </div>
        <p class="footer-desc">AI-powered closing platform for real estate attorneys. From intake to clear-to-close.</p>
        <a href="https://boxfordpartners.com" target="_blank" rel="noopener noreferrer" class="footer-badge">
          <span class="dot"></span>
          <span class="txt">A Boxford Partners Company</span>
        </a>
      </div>
      <div class="footer-col">
        <p class="footer-col-title">Product</p>
        <ul>
          <li><a href="/pricing">Pricing</a></li>
          <li><a href="/demo">Demo</a></li>
          <li><a href="/blog">Blog</a></li>
        </ul>
      </div>
      <div class="footer-col">
        <p class="footer-col-title">Company</p>
        <ul>
          <li><a href="https://boxfordpartners.com" target="_blank" rel="noopener noreferrer">Boxford Partners</a></li>
          <li><a href="mailto:hello@titlewise.app">Contact</a></li>
        </ul>
      </div>
      <div class="footer-col">
        <p class="footer-col-title">Legal</p>
        <ul>
          <li><a href="/privacy">Privacy</a></li>
          <li><a href="/terms">Terms</a></li>
        </ul>
      </div>
    </div>
    <div class="footer-bottom">
      <p>&copy; 2026 Boxford Partners LLC. All rights reserved.</p>
    </div>
  </div>
</footer>`;

const BLOG_FAQ_FOOTER_CSS = `
.faq-section{border-top:1px solid var(--rule);padding:80px 32px}
.faq-inner{max-width:720px;margin:0 auto}
.faq-item{border-bottom:1px solid var(--rule)}
.faq-q{display:flex;align-items:center;justify-content:space-between;padding:20px 0;cursor:pointer;gap:16px}
.faq-q h3{font-size:0.9375rem;font-weight:600;color:var(--text);line-height:1.4}
.faq-q .arrow{color:var(--muted);font-size:1.25rem;transition:transform 0.2s;flex-shrink:0}
.faq-item.open .faq-q .arrow{transform:rotate(45deg);color:var(--blue)}
.faq-a{max-height:0;overflow:hidden;transition:max-height 0.3s ease,padding 0.3s ease}
.faq-item.open .faq-a{max-height:300px;padding-bottom:20px}
.faq-a p{font-size:0.875rem;color:var(--muted);line-height:1.7}
footer{border-top:1px solid var(--rule);background:var(--bg)}
.footer-inner{max-width:1060px;margin:0 auto;padding:56px 32px 0}
.footer-grid{display:grid;grid-template-columns:2fr 1fr 1fr 1fr;gap:0 48px}
@media(max-width:768px){.footer-grid{grid-template-columns:1fr 1fr;row-gap:32px}}
@media(max-width:480px){.footer-grid{grid-template-columns:1fr;text-align:center}.footer-grid ul{align-items:center}.footer-brand{justify-content:center}}
.footer-brand{display:flex;align-items:center;gap:8px}
.footer-desc{margin-top:16px;font-size:0.875rem;color:var(--muted);line-height:1.65;max-width:280px}
.footer-badge{display:inline-flex;align-items:center;gap:7px;margin-top:20px;padding:5px 10px 5px 8px;border:1px solid var(--rule);border-radius:6px;text-decoration:none}
.footer-badge .dot{width:6px;height:6px;border-radius:50%;background:var(--blue);flex-shrink:0}
.footer-badge .txt{font-size:0.65rem;color:var(--muted);text-transform:uppercase;letter-spacing:0.06em;font-weight:600}
.footer-col-title{font-size:0.6875rem;font-weight:600;letter-spacing:0.07em;text-transform:uppercase;color:var(--muted);margin-bottom:16px}
.footer-col ul{list-style:none;padding:0;display:flex;flex-direction:column;gap:12px}
.footer-col ul a{font-size:0.875rem;color:var(--muted);text-decoration:none}
.footer-col ul a:hover{color:var(--text)}
.footer-bottom{border-top:1px solid var(--rule);margin-top:40px;padding:20px 0 24px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:16px}
.footer-bottom p{font-size:0.75rem;color:var(--muted);margin:0}
`;

const BLOG_FAQ_JS = `
function toggleFaq(el){var item=el.parentElement;item.classList.toggle('open');}
`;

function legalPageHTML(baseUrl: string, title: string, updated: string, content: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title} — TitleWise</title>
<link rel="icon" type="image/svg+xml" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 36 43'%3E%3Crect x='10' y='0' width='24' height='32' rx='4' fill='%23ffffff59'/%3E%3Crect x='2' y='8' width='24' height='32' rx='4' fill='%232563EB'/%3E%3C/svg%3E">
<style>
*{margin:0;padding:0;box-sizing:border-box}
:root{--bg:#111827;--text:#EDEEF0;--muted:rgba(237,238,240,0.5);--dim:rgba(237,238,240,0.22);--rule:rgba(237,238,240,0.07);--blue:#3b82f6;--nav-bg:#111827f0;--logo-back:rgba(255,255,255,0.35);--logo-front:#2563EB}
[data-theme="light"]{--bg:#f8fafc;--text:#0f172a;--muted:#64748b;--dim:#94a3b8;--rule:rgba(15,23,42,0.08);--blue:#2563eb;--nav-bg:rgba(248,250,252,0.92);--logo-back:rgba(15,23,42,0.12);--logo-front:#2563EB}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:var(--bg);color:var(--text);min-height:100vh;-webkit-font-smoothing:antialiased;transition:background 0.2s,color 0.2s}
nav{position:sticky;top:0;z-index:100;background:var(--nav-bg);backdrop-filter:blur(12px);border-bottom:1px solid var(--rule);padding:0 40px;height:64px;display:flex;align-items:center;justify-content:space-between}
nav a.logo{text-decoration:none;display:flex;align-items:center;gap:10px}
nav .nav-right{display:flex;align-items:center;gap:24px}
nav .nav-right a{font-size:0.875rem;color:var(--muted);text-decoration:none;transition:color 0.15s}
nav .nav-right a:hover{color:var(--text)}
.nav-cta{font-size:0.875rem;font-weight:600;color:#fff !important;background:var(--blue);border-radius:8px;padding:8px 18px;white-space:nowrap;transition:all 0.2s}
.nav-cta:hover{background:#1d4ed8;transform:translateY(-1px)}
.theme-toggle{display:flex;border:1px solid var(--rule);border-radius:8px;overflow:hidden}
.theme-toggle button{background:transparent;border:none;padding:7px 10px;color:var(--muted);cursor:pointer;transition:all 0.15s;display:flex;align-items:center}
.theme-toggle button.active{background:var(--blue);color:#fff}
.theme-toggle button svg{width:14px;height:14px;fill:currentColor}
.content{max-width:720px;margin:0 auto;padding:80px 32px 120px}
.content .eyebrow{font-size:0.75rem;font-weight:700;color:var(--blue);letter-spacing:0.08em;text-transform:uppercase;margin-bottom:16px}
.content h1{font-size:clamp(1.75rem,4vw,2.5rem);font-weight:800;letter-spacing:-0.03em;margin-bottom:8px}
.content .updated{font-size:0.8rem;color:var(--dim);margin-bottom:48px}
.content h2{font-size:1.125rem;font-weight:700;color:var(--text);margin-top:40px;margin-bottom:12px}
.content p{font-size:0.9375rem;color:var(--muted);line-height:1.75;margin-bottom:16px}
.content ul{padding-left:1.5rem;margin-bottom:16px}
.content li{font-size:0.9375rem;color:var(--muted);line-height:1.75;margin-bottom:8px}
.content strong{color:var(--text);font-weight:600}
.content a{color:var(--blue);text-decoration:none}
.content a:hover{text-decoration:underline}
footer{border-top:1px solid var(--rule);background:var(--bg)}
.footer-inner{max-width:1060px;margin:0 auto;padding:56px 32px 0}
.footer-grid{display:grid;grid-template-columns:2fr 1fr 1fr 1fr;gap:0 48px}
.footer-brand{display:flex;align-items:center;gap:8px}
.footer-desc{margin-top:16px;font-size:0.875rem;color:var(--muted);line-height:1.65;max-width:280px}
.footer-badge{display:inline-flex;align-items:center;gap:7px;margin-top:20px;padding:5px 10px 5px 8px;border:1px solid var(--rule);border-radius:6px;text-decoration:none;background:transparent}
.footer-badge .dot{width:6px;height:6px;border-radius:50%;background:var(--blue);flex-shrink:0}
.footer-badge .txt{font-size:0.65rem;color:var(--dim);text-transform:uppercase;letter-spacing:0.06em;font-weight:600}
.footer-col-title{font-size:0.6875rem;font-weight:600;letter-spacing:0.07em;text-transform:uppercase;color:var(--dim);margin-bottom:16px}
.footer-col ul{list-style:none;padding:0;display:flex;flex-direction:column;gap:12px}
.footer-col ul a{font-size:0.875rem;color:var(--muted);text-decoration:none}
.footer-col ul a:hover{color:var(--text)}
.footer-bottom{border-top:1px solid var(--rule);margin-top:40px;padding:20px 0 24px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:16px}
.footer-bottom p{font-size:0.75rem;color:var(--dim);margin:0}
@media(max-width:768px){nav{padding:0 20px}.footer-grid{grid-template-columns:1fr 1fr;row-gap:32px}.content{padding:48px 20px 80px}.footer-inner{padding:40px 24px 0}}
@media(max-width:480px){nav{padding:0 16px}nav .nav-right a.tw-nav-link{display:none}.footer-grid{grid-template-columns:1fr;text-align:center}.content{padding:40px 16px 64px}}
#cookie-banner{position:fixed;bottom:0;left:0;right:0;z-index:9999;background:var(--card);border-top:1px solid var(--rule);padding:16px 24px;box-shadow:0 -4px 20px rgba(0,0,0,0.15)}
.cb-inner{max-width:960px;margin:0 auto;display:flex;align-items:center;justify-content:space-between;gap:16px;flex-wrap:wrap}
.cb-inner p{font-size:0.8125rem;color:var(--muted);margin:0;line-height:1.5}
.cb-inner a{color:var(--blue);text-decoration:none}
.cb-btns{display:flex;gap:8px;flex-shrink:0}
.cb-btns button{padding:8px 16px;border-radius:6px;font-size:0.8125rem;font-weight:600;cursor:pointer;border:none;transition:background 0.2s}
.cb-btns button:first-child{background:#2563eb;color:#fff}
.cb-btns button:first-child:hover{background:#1d4ed8}
.cb-btns button:last-child{background:transparent;color:var(--muted);border:1px solid var(--rule)}
.cb-btns button:last-child:hover{border-color:var(--muted)}
</style>
</head>
<body>
<nav>
  <a class="logo" href="/">
    <svg height="28" viewBox="0 0 36 43" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="10" y="0" width="24" height="32" rx="4" fill="var(--logo-back)"/>
      <rect x="2" y="8" width="24" height="32" rx="4" fill="var(--logo-front)"/>
    </svg>
    <span style="font-size:1.125rem;line-height:1"><b style="font-weight:700;color:var(--text);letter-spacing:-0.01em">TITLE</b><span style="font-weight:300;color:var(--muted)">wise</span></span>
  </a>
  <div class="nav-right">
    <a href="/pricing" class="tw-nav-link">Pricing</a>
    <a href="/demo" class="tw-nav-link">Demo</a>
    <a href="/login" class="tw-nav-link">Log in</a>
    <div class="theme-toggle">
      <button id="btn-dark" class="active" onclick="setTheme('dark')" aria-label="Dark mode"><svg viewBox="0 0 24 24"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg></button>
      <button id="btn-light" onclick="setTheme('light')" aria-label="Light mode"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" stroke="currentColor" stroke-width="2" stroke-linecap="round" fill="none"/></svg></button>
    </div>
    <a href="/pricing" class="nav-cta">Get Started</a>
  </div>
</nav>
<div class="content">
  ${updated ? `<p class="eyebrow">Legal</p>` : ""}
  <h1>${title}</h1>
  ${updated ? `<p class="updated">Last updated: ${updated}</p>` : ""}
  ${content}
</div>
<footer>
  <div class="footer-inner">
    <div class="footer-grid">
      <div>
        <div class="footer-brand">
          <svg height="22" viewBox="0 0 36 43" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="10" y="0" width="24" height="32" rx="4" fill="var(--logo-back)"/>
            <rect x="2" y="8" width="24" height="32" rx="4" fill="var(--logo-front)"/>
          </svg>
          <span style="font-size:1rem;line-height:1"><b style="font-weight:700;color:var(--text);letter-spacing:-0.01em">TITLE</b><span style="font-weight:300;color:var(--muted)">wise</span></span>
        </div>
        <p class="footer-desc">AI-powered closing platform for real estate attorneys. From intake to clear-to-close.</p>
        <a href="https://boxfordpartners.com" target="_blank" rel="noopener noreferrer" class="footer-badge">
          <span class="dot"></span>
          <span class="txt">A Boxford Partners Company</span>
        </a>
      </div>
      <div class="footer-col">
        <p class="footer-col-title">Product</p>
        <ul>
          <li><a href="/pricing">Pricing</a></li>
          <li><a href="/demo">Demo</a></li>
          <li><a href="/blog">Blog</a></li>
        </ul>
      </div>
      <div class="footer-col">
        <p class="footer-col-title">Company</p>
        <ul>
          <li><a href="https://boxfordpartners.com" target="_blank" rel="noopener noreferrer">Boxford Partners</a></li>
          <li><a href="mailto:hello@titlewise.app">Contact</a></li>
        </ul>
      </div>
      <div class="footer-col">
        <p class="footer-col-title">Legal</p>
        <ul>
          <li><a href="/privacy">Privacy</a></li>
          <li><a href="/terms">Terms</a></li>
        </ul>
      </div>
    </div>
    <div class="footer-bottom">
      <p>&copy; 2026 Boxford Partners LLC. All rights reserved.</p>
    </div>
  </div>
</footer>
<script>
function setTheme(t){
  document.documentElement.setAttribute('data-theme',t);
  document.getElementById('btn-dark').classList.toggle('active',t==='dark');
  document.getElementById('btn-light').classList.toggle('active',t==='light');
  try{localStorage.setItem('tw-theme',t)}catch(e){}
}
(function(){var t;try{t=localStorage.getItem('tw-theme')}catch(e){}if(t)setTheme(t);})();
(function(){
  if(localStorage.getItem('tw-cookies'))return;
  var b=document.createElement('div');
  b.id='cookie-banner';
  b.innerHTML='<div class="cb-inner"><p>We use cookies to improve your experience and analyze site traffic. See our <a href="/privacy">Privacy Policy</a>.</p><div class="cb-btns"><button onclick="acceptCookies()">Accept</button><button onclick="declineCookies()">Decline</button></div></div>';
  document.body.appendChild(b);
})();
function acceptCookies(){localStorage.setItem('tw-cookies','accepted');document.getElementById('cookie-banner').remove();}
function declineCookies(){localStorage.setItem('tw-cookies','declined');document.getElementById('cookie-banner').remove();}
</script>
</body>
</html>`;
}

function blogIndexHTML(baseUrl: string): string {
  const postCards = BLOG_POSTS.map(p => `
    <a href="/blog/${p.slug}" class="blog-card">
      <span class="blog-cat">${p.category}</span>
      <h3>${p.title}</h3>
      <p>${p.description}</p>
      <div class="blog-meta"><span>${p.date}</span><span>${p.readTime}</span></div>
    </a>`).join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Blog - TitleWise</title>
<meta name="description" content="Insights on AI-powered title review, real estate closing automation, and document intelligence for closing attorneys.">
<link rel="canonical" href="${baseUrl}/blog">
<style>
:root{--bg:#111827;--text:#EDEEF0;--muted:rgba(237,238,240,0.5);--blue:#3b82f6;--rule:rgba(237,238,240,0.1);--nav-bg:rgba(17,24,39,0.95);--logo-back:#3b82f6;--logo-front:#EDEEF0}
[data-theme="light"]{--bg:#ffffff;--text:#111827;--muted:rgba(17,24,39,0.6);--rule:rgba(17,24,39,0.1);--nav-bg:rgba(255,255,255,0.95);--logo-back:#3b82f6;--logo-front:#111827}
*{margin:0;padding:0;box-sizing:border-box}
body{background:var(--bg);color:var(--text);font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;line-height:1.6}
nav{position:sticky;top:0;z-index:100;background:var(--nav-bg);backdrop-filter:blur(12px);border-bottom:1px solid var(--rule);padding:14px 24px;display:flex;align-items:center;gap:16px}
.logo{display:flex;align-items:center;gap:10px;text-decoration:none;font-weight:800;font-size:1.1rem;color:var(--text)}
.logo svg{height:24px;width:auto}
nav a.nav-link{color:var(--muted);text-decoration:none;font-size:0.9rem;margin-left:auto}
nav a.nav-link+a.nav-link{margin-left:16px}
.blog-wrap{max-width:800px;margin:0 auto;padding:60px 24px 80px}
h1{font-size:clamp(1.8rem,4vw,2.4rem);font-weight:800;letter-spacing:-0.03em;margin-bottom:8px}
.blog-sub{color:var(--muted);margin-bottom:48px}
.blog-card{display:block;text-decoration:none;color:var(--text);border:1px solid var(--rule);border-radius:8px;padding:24px;margin-bottom:20px;transition:border-color 0.2s,transform 0.2s}
.blog-card:hover{border-color:var(--blue);transform:translateY(-2px)}
.blog-card h3{font-size:1.15rem;font-weight:700;margin:8px 0 10px;line-height:1.4}
.blog-card p{color:var(--muted);font-size:0.92rem;line-height:1.5}
.blog-cat{font-size:0.75rem;text-transform:uppercase;letter-spacing:0.05em;color:var(--blue);font-weight:600}
.blog-meta{display:flex;gap:16px;margin-top:12px;font-size:0.8rem;color:var(--muted)}
${BLOG_FAQ_FOOTER_CSS}
</style>
</head>
<body>
<nav>
  <a class="logo" href="/">
    <svg height="24" viewBox="0 0 36 43" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="10" y="0" width="24" height="32" rx="4" fill="var(--logo-back, #3b82f6)"/><rect x="2" y="8" width="24" height="32" rx="4" fill="var(--logo-front, #EDEEF0)"/></svg>
    <span style="font-size:1.1rem;line-height:1"><b style="font-weight:700;color:var(--text);letter-spacing:-0.01em">TITLE</b><span style="font-weight:300;color:var(--muted)">wise</span></span>
  </a>
  <a href="/" class="nav-link">Home</a>
  <a href="/demo" class="nav-link">Demo</a>
</nav>
<div class="blog-wrap">
  <h1>Blog</h1>
  <p class="blog-sub">Insights on AI-powered title review and real estate closing automation.</p>
  ${postCards}
</div>
${BLOG_FAQ_HTML}
${BLOG_FOOTER_HTML}
<script>
const t=localStorage.getItem('tw-theme');if(t)document.documentElement.setAttribute('data-theme',t);
${BLOG_FAQ_JS}
</script>
</body>
</html>`;
}

function blogPostHTML(post: BlogPost, baseUrl: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${post.title} - TitleWise</title>
<meta name="description" content="${post.description}">
<link rel="canonical" href="${post.canonical || baseUrl + '/blog/' + post.slug}">
<meta property="og:title" content="${post.title}">
<meta property="og:description" content="${post.description}">
<meta property="og:type" content="article">
<meta property="og:url" content="${baseUrl}/blog/${post.slug}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${post.title}">
<meta name="twitter:description" content="${post.description}">
<style>
:root{--bg:#111827;--text:#EDEEF0;--muted:rgba(237,238,240,0.5);--blue:#3b82f6;--rule:rgba(237,238,240,0.1);--nav-bg:rgba(17,24,39,0.95);--logo-back:#3b82f6;--logo-front:#EDEEF0}
[data-theme="light"]{--bg:#ffffff;--text:#111827;--muted:rgba(17,24,39,0.6);--rule:rgba(17,24,39,0.1);--nav-bg:rgba(255,255,255,0.95);--logo-back:#3b82f6;--logo-front:#111827}
*{margin:0;padding:0;box-sizing:border-box}
body{background:var(--bg);color:var(--text);font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;line-height:1.7}
nav{position:sticky;top:0;z-index:100;background:var(--nav-bg);backdrop-filter:blur(12px);border-bottom:1px solid var(--rule);padding:14px 24px;display:flex;align-items:center;gap:16px}
.logo{display:flex;align-items:center;gap:10px;text-decoration:none;font-weight:800;font-size:1.1rem;color:var(--text)}
.logo svg{height:24px;width:auto}
nav a.nav-link{color:var(--muted);text-decoration:none;font-size:0.9rem;margin-left:auto}
nav a.nav-link+a.nav-link{margin-left:16px}
article{max-width:720px;margin:0 auto;padding:60px 24px 80px}
.article-cat{font-size:0.75rem;text-transform:uppercase;letter-spacing:0.05em;color:var(--blue);font-weight:600}
h1{font-size:clamp(1.6rem,3.5vw,2.2rem);font-weight:800;letter-spacing:-0.02em;margin:12px 0 16px;line-height:1.3}
.article-meta{display:flex;gap:16px;font-size:0.85rem;color:var(--muted);margin-bottom:40px;flex-wrap:wrap}
.article-meta a{color:var(--blue);text-decoration:none}
.article-body h2{font-size:1.3rem;font-weight:700;margin:40px 0 16px;letter-spacing:-0.01em}
.article-body p{margin-bottom:18px;color:var(--text);opacity:0.92}
.back-link{display:inline-block;margin-top:48px;color:var(--blue);text-decoration:none;font-size:0.9rem}
.back-link:hover{text-decoration:underline}
${BLOG_FAQ_FOOTER_CSS}
</style>
</head>
<body>
<nav>
  <a class="logo" href="/">
    <svg height="24" viewBox="0 0 36 43" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="10" y="0" width="24" height="32" rx="4" fill="var(--logo-back, #3b82f6)"/><rect x="2" y="8" width="24" height="32" rx="4" fill="var(--logo-front, #EDEEF0)"/></svg>
    <span style="font-size:1.1rem;line-height:1"><b style="font-weight:700;color:var(--text);letter-spacing:-0.01em">TITLE</b><span style="font-weight:300;color:var(--muted)">wise</span></span>
  </a>
  <a href="/blog" class="nav-link">Blog</a>
  <a href="/demo" class="nav-link">Demo</a>
</nav>
<article>
  <span class="article-cat">${post.category}</span>
  <h1>${post.title}</h1>
  <div class="article-meta">
    <span>By <a href="${post.authorUrl}">${post.author}</a></span>
    <span>${post.date}</span>
    <span>${post.readTime}</span>
  </div>
  <div class="article-body">
    ${post.body}
  </div>
  <a href="/blog" class="back-link">&larr; All posts</a>
</article>
${BLOG_FAQ_HTML}
${BLOG_FOOTER_HTML}
<script>
const t=localStorage.getItem('tw-theme');if(t)document.documentElement.setAttribute('data-theme',t);
${BLOG_FAQ_JS}
</script>
</body>
</html>`;
}

function getDemoEvents(tool: string): Array<{delay: number; event: any}> {
  const wireEvents = [
    {delay:100,event:{stage:"pipeline",agent:"Closing Coordinator",status:"start",message:"New document received. Initiating wire verification pipeline."}},
    {delay:200,event:{stage:"extract",agent:"Entity Extractor",status:"start",message:"Scanning document for entities..."}},
    {delay:600,event:{stage:"extract",agent:"Entity Extractor",status:"complete",message:"Extracted 4 entities: 1 bank, 1 routing number, 1 beneficiary, 1 amount",data:{beneficiaries:["Pacific Coast Settlements LLC"],routingNumbers:["021000089"],banks:["JPMorgan Chase"],amounts:["$847,291.00"],addresses:["742 Evergreen Terrace, San Mateo, CA 94401"]}}},
    {delay:150,event:{stage:"memory",agent:"Mitosis Memory",status:"start",message:"Querying fraud-patterns DB for known bad actors..."}},
    {delay:400,event:{stage:"memory",agent:"Mitosis Memory",status:"complete",message:"No prior fraud flags for these entities. Querying deal-ledger for consistency check..."}},
    {delay:300,event:{stage:"memory",agent:"Mitosis Memory",status:"progress",message:"Deal-ledger match found: routing 021000089 seen in 2 prior closings for this title company. Consistent."}},
    {delay:150,event:{stage:"analysis",agent:"Primary Analyst",status:"start",message:"Running Claude Sonnet 5 analysis on wire transfer instructions..."}},
    {delay:1800,event:{stage:"analysis",agent:"Primary Analyst",status:"complete",message:"Analysis complete. 2 fraud indicators found, 3 verification recommendations generated."}},
    {delay:100,event:{stage:"tavily",agent:"Tavily Web Verifier",status:"start",message:"Verifying routing number 021000089 against bank records..."}},
    {delay:700,event:{stage:"tavily",agent:"Tavily Web Verifier",status:"progress",message:"Routing 021000089 confirmed: JPMorgan Chase, New York, NY",data:{entity:"021000089 (JPMorgan Chase)",verified:true}}},
    {delay:200,event:{stage:"tavily",agent:"Tavily Web Verifier",status:"progress",message:"Verifying beneficiary: Pacific Coast Settlements LLC...",data:{entity:"Pacific Coast Settlements LLC",verified:true}}},
    {delay:500,event:{stage:"tavily",agent:"Tavily Web Verifier",status:"complete",message:"Web verification complete. 2/2 entities verified."}},
    {delay:100,event:{stage:"records",agent:"County Records Searcher",status:"start",message:"Searching San Mateo County assessor records..."}},
    {delay:600,event:{stage:"records",agent:"County Records Searcher",status:"complete",message:"Property found: 742 Evergreen Terrace. Owner matches seller name. No liens."}},
    {delay:100,event:{stage:"adversarial",agent:"Skeptic",status:"start",message:"Reviewing findings for false positives..."}},
    {delay:100,event:{stage:"adversarial",agent:"Compliance Officer",status:"start",message:"Evaluating against BSA/AML standards..."}},
    {delay:100,event:{stage:"adversarial",agent:"Forensic Investigator",status:"start",message:"Checking for BEC/wire fraud patterns..."}},
    {delay:1200,event:{stage:"adversarial",agent:"Skeptic",status:"complete",message:"No false positives identified. Fraud indicators are legitimate concerns."}},
    {delay:200,event:{stage:"adversarial",agent:"Compliance Officer",status:"complete",message:"Routing number format valid. Transaction structure normal for residential closing."}},
    {delay:300,event:{stage:"adversarial",agent:"Forensic Investigator",status:"complete",message:"No BEC indicators. No urgency language. Beneficiary naming follows standard LLC convention."}},
    {delay:100,event:{stage:"audit",agent:"Deal Auditor",status:"start",message:"Cross-referencing deal facts across all documents..."}},
    {delay:400,event:{stage:"audit",agent:"Deal Auditor",status:"complete",message:"All facts consistent. No discrepancies across deal file."}},
    {delay:100,event:{stage:"synthesis",agent:"Risk Synthesizer",status:"start",message:"Computing composite risk score..."}},
    {delay:300,event:{stage:"synthesis",agent:"Risk Synthesizer",status:"complete",message:"Risk synthesis complete. Score: 18/100 (LOW)"}},
    {delay:100,event:{stage:"pipeline",agent:"Closing Coordinator",status:"complete",message:"Pipeline complete. 12 agents invoked. Verdict: LOW RISK — safe to proceed."}},
    {delay:50,event:{stage:"final",data:{risk_synthesis:{risk_level:"LOW",composite_risk_score:18,signals:["Minor: no callback number provided","Minor: no verification instructions"]},pipeline:{agents_invoked:["Entity Extractor","Primary Analyst","Tavily Web Verifier","County Records Searcher","Mitosis Memory","Pattern Matcher","Skeptic","Compliance Officer","Forensic Investigator","Deal Auditor","Risk Synthesizer","Audit Trail"],total_agents:12,duration_ms:6200}}}},
  ];

  const fraudEvents = [
    {delay:100,event:{stage:"pipeline",agent:"Closing Coordinator",status:"start",message:"New document received. Initiating wire verification pipeline."}},
    {delay:200,event:{stage:"extract",agent:"Entity Extractor",status:"start",message:"Scanning document for entities..."}},
    {delay:600,event:{stage:"extract",agent:"Entity Extractor",status:"complete",message:"Extracted 5 entities: 1 bank, 1 routing number, 1 beneficiary, 2 amounts",data:{beneficiaries:["Pacfic Coast Setlements LLC"],routingNumbers:["021000021"],banks:["Bank of the West"],amounts:["$847,291.00","$847,921.00"],addresses:["742 Evergreen Terrace, San Mateo, CA 94401"]}}},
    {delay:150,event:{stage:"memory",agent:"Mitosis Memory",status:"start",message:"Querying fraud-patterns DB for known bad actors..."}},
    {delay:500,event:{stage:"memory",agent:"Mitosis Memory",status:"progress",message:"ALERT: Routing 021000021 flagged in fraud-patterns DB. Previously associated with BEC attack (File #2024-SF-38291)."}},
    {delay:200,event:{stage:"memory",agent:"Mitosis Memory",status:"complete",message:"Deal-ledger MISMATCH: Prior closings used routing 021000089 (JPMorgan Chase). This document shows 021000021 (Bank of the West). ROUTING NUMBER CHANGED."}},
    {delay:150,event:{stage:"analysis",agent:"Primary Analyst",status:"start",message:"Running Claude Sonnet 5 analysis on wire transfer instructions..."}},
    {delay:2000,event:{stage:"analysis",agent:"Primary Analyst",status:"complete",message:"Analysis complete. 5 HIGH-severity fraud indicators detected."}},
    {delay:100,event:{stage:"tavily",agent:"Tavily Web Verifier",status:"start",message:"Verifying routing number 021000021 against bank records..."}},
    {delay:800,event:{stage:"tavily",agent:"Tavily Web Verifier",status:"progress",message:"MISMATCH: Routing 021000021 belongs to Bank of America, NOT 'Bank of the West' as claimed",data:{entity:"021000021 (Bank of the West)",verified:false}}},
    {delay:300,event:{stage:"tavily",agent:"Tavily Web Verifier",status:"progress",message:"Beneficiary search: No business registration found for 'Pacfic Coast Setlements LLC' — possible typosquat of legitimate entity",data:{entity:"Pacfic Coast Setlements LLC",verified:false}}},
    {delay:400,event:{stage:"tavily",agent:"Tavily Web Verifier",status:"complete",message:"Web verification complete. 0/2 entities verified. CRITICAL FAILURES."}},
    {delay:100,event:{stage:"adversarial",agent:"Skeptic",status:"start",message:"Reviewing findings for false positives..."}},
    {delay:100,event:{stage:"adversarial",agent:"Compliance Officer",status:"start",message:"Evaluating against BSA/AML standards..."}},
    {delay:100,event:{stage:"adversarial",agent:"Forensic Investigator",status:"start",message:"Checking for BEC/wire fraud patterns..."}},
    {delay:1400,event:{stage:"adversarial",agent:"Skeptic",status:"complete",message:"CONFIRMED: Cannot explain innocently. Beneficiary name is a deliberate misspelling. Routing number change is unexplained."}},
    {delay:200,event:{stage:"adversarial",agent:"Compliance Officer",status:"complete",message:"CRITICAL: Routing number bank mismatch is a primary BEC indicator per FinCEN Advisory FIN-2016-A003. Immediate SAR consideration."}},
    {delay:300,event:{stage:"adversarial",agent:"Forensic Investigator",status:"complete",message:"CONFIRMED BEC PATTERN: Name typosquat + routing swap + amount discrepancy ($847,291 vs $847,921 = $630 delta). Classic wire redirect attack."}},
    {delay:100,event:{stage:"audit",agent:"Deal Auditor",status:"start",message:"Cross-referencing deal facts across all documents..."}},
    {delay:200,event:{stage:"audit",agent:"Deal Auditor",status:"progress",message:"DISCREPANCY: Beneficiary name mismatch vs. prior documents",data:{field:"beneficiary_name",current_value:"Pacfic Coast Setlements LLC",prior_value:"Pacific Coast Settlements LLC",prior_document:"Title Commitment",severity:"critical"}}},
    {delay:300,event:{stage:"audit",agent:"Deal Auditor",status:"complete",message:"2 critical discrepancies flagged. Deal integrity compromised."}},
    {delay:100,event:{stage:"synthesis",agent:"Risk Synthesizer",status:"start",message:"Computing composite risk score..."}},
    {delay:300,event:{stage:"synthesis",agent:"Risk Synthesizer",status:"complete",message:"Risk synthesis complete. Score: 94/100 (CRITICAL)"}},
    {delay:100,event:{stage:"alert",agent:"Cotal Alert Broadcaster",status:"start",message:"Risk level CRITICAL — broadcasting fraud alert to agent network..."}},
    {delay:400,event:{stage:"alert",agent:"Cotal Alert Broadcaster",status:"complete",message:"Fraud alert broadcast to Cotal network. 3 recipients notified."}},
    {delay:100,event:{stage:"pipeline",agent:"Closing Coordinator",status:"complete",message:"DO NOT proceed with this transaction. 14 agents reviewed this document and the consensus is clear — too many red flags. Verify everything through independent channels before moving forward."}},
    {delay:50,event:{stage:"final",data:{risk_synthesis:{risk_level:"CRITICAL",composite_risk_score:94,signals:["Routing number changed from prior closings","Routing number bank mismatch (claims Bank of the West, actually Bank of America)","Beneficiary name typosquat (Pacfic Coast Setlements vs Pacific Coast Settlements)","Amount discrepancy ($630 delta between two references)","Routing flagged in fraud-patterns DB from prior BEC attack"]},pipeline:{agents_invoked:["Entity Extractor","Primary Analyst","Tavily Web Verifier","County Records Searcher","Mitosis Memory","Pattern Matcher","Skeptic","Compliance Officer","Forensic Investigator","Deal Auditor","Risk Synthesizer","Fraud DB Writer","Cotal Alert Broadcaster","Audit Trail"],total_agents:14,duration_ms:8400}}}},
  ];

  if (tool === "verify_wire") return wireEvents;
  return fraudEvents;
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    const baseUrl = `${url.protocol}//${url.host}`;

    // Discovery endpoints — no auth required
    if (url.pathname === "/llms.txt" || url.pathname === "/.well-known/llms.txt") {
      return new Response(LLMS_TXT, {
        headers: { "Content-Type": "text/plain; charset=utf-8" },
      });
    }

    if (url.pathname === "/robots.txt") {
      return new Response(`User-agent: *\nAllow: /\n\nSitemap: ${baseUrl}/sitemap.xml\n`, {
        headers: { "Content-Type": "text/plain; charset=utf-8" },
      });
    }

    if (url.pathname === "/sitemap.xml") {
      const urls = [
        { loc: baseUrl + "/", priority: "1.0" },
        { loc: baseUrl + "/blog", priority: "0.8" },
        { loc: baseUrl + "/demo", priority: "0.7" },
        ...BLOG_POSTS.map(p => ({ loc: baseUrl + "/blog/" + p.slug, priority: "0.7" })),
      ];
      const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map(u => `  <url><loc>${u.loc}</loc><priority>${u.priority}</priority></url>`).join("\n")}\n</urlset>`;
      return new Response(xml, {
        headers: { "Content-Type": "application/xml; charset=utf-8" },
      });
    }

    if (url.pathname === "/.well-known/api-catalog") {
      return new Response(JSON.stringify({
        linkset: [{
          anchor: baseUrl + "/",
          "service-desc": [{ href: baseUrl + "/llms.txt", type: "text/plain" }],
          "service-doc": [{ href: baseUrl + "/llms.txt", type: "text/plain" }],
          status: [{ href: baseUrl + "/health", type: "application/json" }],
        }]
      }), {
        headers: { "Content-Type": "application/linkset+json", "Access-Control-Allow-Origin": "*" },
      });
    }

    if (url.pathname === "/.well-known/mcp/server-card.json") {
      return new Response(JSON.stringify({
        serverInfo: { name: "TitleWise", version: "1.0.0" },
        transport: { type: "sse", url: baseUrl + "/sse" },
        capabilities: {
          tools: TOOL_NAMES.map(t => ({ name: t })),
        },
        description: "Real estate document intelligence — title commitments, wire fraud detection, closing disclosure review, and HOA analysis via MCP.",
      }), {
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      });
    }

    if (url.pathname === "/.well-known/agent-skills/index.json") {
      return new Response(JSON.stringify({
        "$schema": "https://agentskills.io/schema/v0.2.0/index.json",
        skills: [
          { name: "analyze_commitment", type: "mcp-tool", description: "Parse title commitments, extract requirements/exceptions, flag red flags", url: baseUrl + "/sse" },
          { name: "verify_wire", type: "mcp-tool", description: "Detect wire fraud indicators in transfer instructions", url: baseUrl + "/sse" },
          { name: "analyze_closing_disclosure", type: "mcp-tool", description: "TRID compliance review of Closing Disclosures", url: baseUrl + "/sse" },
          { name: "review_hoa", type: "mcp-tool", description: "Extract fees, restrictions, and transfer requirements from HOA docs", url: baseUrl + "/sse" },
        ],
      }), {
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      });
    }

    if (url.pathname === "/.well-known/ai-catalog.json") {
      return new Response(JSON.stringify({
        specVersion: "0.1.0",
        host: { name: "TitleWise", url: baseUrl },
        entries: [
          {
            identifier: "urn:air:titlewise.app:mcp:titlewise-agent",
            displayName: "TitleWise MCP Agent",
            type: "application/mcp+json",
            url: baseUrl + "/sse",
            representativeQueries: [
              "Analyze this title commitment for red flags",
              "Verify these wire transfer instructions for fraud",
              "Review this closing disclosure for TRID compliance",
              "Check this HOA document for transfer fees and restrictions",
              "What tools does TitleWise offer for real estate closings?",
            ],
          },
          {
            identifier: "urn:air:titlewise.app:docs:llms-txt",
            displayName: "TitleWise Agent Documentation",
            type: "text/plain",
            url: baseUrl + "/llms.txt",
            representativeQueries: [
              "How do I connect to TitleWise?",
              "What authentication does TitleWise require?",
            ],
          },
        ],
      }), {
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      });
    }

    if (url.pathname === "/auth.md") {
      return new Response(`# Auth.md

## TitleWise Agent Access

TitleWise uses Immersive Commons (IC) agent tokens for authentication.

### Getting a Token

1. Register your agent at the IC Agent Registry
2. Request scope: \`titlewise:analyze\` or \`hack:*\` (hackathon mode)
3. Receive a bearer token

### Using the Token

Pass the token in the Authorization header:

\`\`\`
Authorization: Bearer <ic_agent_token>
\`\`\`

### Endpoints

- **MCP (SSE):** ${baseUrl}/sse
- **REST API:** ${baseUrl}/api/analyze (POST)
- **Health:** ${baseUrl}/health (no auth required)
- **Discovery:** ${baseUrl}/llms.txt (no auth required)

### Scopes

| Scope | Access |
|-------|--------|
| \`titlewise:analyze\` | All analysis tools |
| \`hack:*\` | Full access (hackathon mode) |

### Payment

Tools require payment via the x402 protocol. After authentication:
1. GET ${baseUrl}/api/quote?tool=<tool_name>
2. POST ${baseUrl}/api/checkout?tool=<tool_name>
3. Complete Stripe payment
4. Retry with header: \`X-Payment-Receipt: stripe:<payment_intent_id>\`
`, {
        headers: { "Content-Type": "text/markdown; charset=utf-8" },
      });
    }

    if (url.pathname === "/.well-known/oauth-authorization-server") {
      return new Response(JSON.stringify({
        issuer: baseUrl,
        authorization_endpoint: baseUrl + "/auth.md",
        token_endpoint: baseUrl + "/api/checkout",
        grant_types_supported: ["client_credentials"],
        scopes_supported: ["titlewise:analyze", "hack:*"],
        response_types_supported: ["token"],
        token_endpoint_auth_methods_supported: ["bearer"],
        service_documentation: baseUrl + "/llms.txt",
        agent_auth: {
          register_uri: baseUrl + "/auth.md",
          supported_identity_types: ["agent_token"],
          supported_credential_types: ["bearer_token"],
        },
      }), {
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      });
    }

    if (url.pathname === "/.well-known/oauth-protected-resource") {
      return new Response(JSON.stringify({
        resource: baseUrl,
        authorization_servers: [baseUrl],
        scopes_supported: ["titlewise:analyze", "hack:*"],
        bearer_methods_supported: ["header"],
        resource_documentation: baseUrl + "/llms.txt",
      }), {
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      });
    }

    if (url.pathname === "/.well-known/openid-configuration") {
      return new Response(JSON.stringify({
        issuer: baseUrl,
        authorization_endpoint: baseUrl + "/auth.md",
        token_endpoint: baseUrl + "/api/checkout",
        jwks_uri: baseUrl + "/.well-known/jwks.json",
        scopes_supported: ["titlewise:analyze", "hack:*"],
        response_types_supported: ["token"],
        grant_types_supported: ["client_credentials"],
        subject_types_supported: ["public"],
        id_token_signing_alg_values_supported: ["RS256"],
        service_documentation: baseUrl + "/llms.txt",
      }), {
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      });
    }

    if (url.pathname === "/.well-known/jwks.json") {
      return new Response(JSON.stringify({ keys: [] }), {
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      });
    }

    if (url.pathname === "/") {
      const accept = request.headers.get("Accept") || "";
      const linkHeaders = [
        `<${baseUrl}/.well-known/api-catalog>; rel="api-catalog"`,
        `<${baseUrl}/llms.txt>; rel="service-doc"`,
        `<${baseUrl}/sse>; rel="service"`,
        `<${baseUrl}/.well-known/mcp/server-card.json>; rel="describedby"`,
      ].join(", ");

      if (accept.includes("text/markdown") && !accept.includes("text/html")) {
        return new Response(LLMS_TXT, {
          headers: { "Content-Type": "text/markdown; charset=utf-8", "Link": linkHeaders },
        });
      }
      if (accept.includes("application/json") && !accept.includes("text/html")) {
        return new Response(JSON.stringify({
          name: "TitleWise Agent Gateway",
          version: "1.0.0",
          description: "Real estate document intelligence via MCP",
          mcp_endpoint: "/sse",
          discovery: "/llms.txt",
          auth: "Bearer <ic_agent_token>",
          tools: TOOL_NAMES,
        }), {
          headers: { "Content-Type": "application/json", "Link": linkHeaders },
        });
      }
      return new Response(landingPageHTML(baseUrl), {
        headers: { "Content-Type": "text/html; charset=utf-8", "Link": linkHeaders },
      });
    }

    if (url.pathname === "/health") {
      return new Response(JSON.stringify({ status: "ok", timestamp: new Date().toISOString() }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    if (url.pathname === "/favicon.ico" || url.pathname === "/favicon.svg") {
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 36 43"><rect x="10" y="0" width="24" height="32" rx="4" fill="#ffffff59"/><rect x="2" y="8" width="24" height="32" rx="4" fill="#2563EB"/></svg>`;
      return new Response(svg, {
        headers: { "Content-Type": "image/svg+xml", "Cache-Control": "public, max-age=31536000" },
      });
    }

    if (url.pathname === "/demo" || url.pathname === "/try") {
      return new Response(tryPageHTML(baseUrl), {
        headers: { "Content-Type": "text/html; charset=utf-8" },
      });
    }

    if (url.pathname === "/login") {
      return new Response(`<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Log In — TitleWise</title>
<style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#0a0a0f;color:#e4e4e7;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:2rem}.wrap{width:100%;max-width:400px}.logo{display:flex;align-items:center;gap:8px;margin-bottom:2rem;justify-content:center}.logo b{font-size:1.125rem;color:#fff}.logo span{font-size:1.125rem;font-weight:300;color:#94a3b8}h1{font-size:1.5rem;font-weight:700;text-align:center;margin-bottom:0.5rem}p.sub{text-align:center;color:#64748b;font-size:0.875rem;margin-bottom:2rem}form{display:flex;flex-direction:column;gap:1rem}label{font-size:0.8rem;color:#94a3b8;font-weight:500}input{width:100%;padding:0.75rem 1rem;background:#1e293b;border:1px solid #334155;border-radius:8px;color:#e2e8f0;font-size:0.9rem;outline:none;transition:border-color 0.2s}input:focus{border-color:#2563eb}button{margin-top:0.5rem;padding:0.85rem;background:#2563eb;color:#fff;border:none;border-radius:8px;font-size:0.9rem;font-weight:600;cursor:pointer;transition:background 0.2s}button:hover{background:#1d4ed8}.links{text-align:center;margin-top:1.5rem;font-size:0.8rem;color:#64748b}.links a{color:#60a5fa;text-decoration:none}.links a:hover{text-decoration:underline}.divider{display:flex;align-items:center;gap:1rem;margin:1.5rem 0;color:#475569;font-size:0.75rem}.divider::before,.divider::after{content:"";flex:1;height:1px;background:#1e293b}.oauth-btn{display:flex;align-items:center;justify-content:center;gap:0.5rem;padding:0.75rem;background:#1e293b;border:1px solid #334155;border-radius:8px;color:#e2e8f0;font-size:0.85rem;font-weight:500;cursor:pointer;text-decoration:none;transition:border-color 0.2s}.oauth-btn:hover{border-color:#2563eb}</style></head><body>
<div class="wrap">
<div class="logo"><b>TITLE</b><span>wise</span></div>
<h1>Welcome back</h1>
<p class="sub">Log in to your TitleWise account</p>
<form action="/api/login" method="POST">
<div><label>Email</label><input type="email" name="email" placeholder="you@firm.com" required></div>
<div><label>Password</label><input type="password" name="password" placeholder="Enter your password" required></div>
<button type="submit">Log in</button>
</form>
<p class="links">Don't have an account? <a href="/signup">Sign up</a></p>
</div></body></html>`, { headers: { "Content-Type": "text/html; charset=utf-8" } });
    }

    if (url.pathname === "/signup") {
      return new Response(`<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Sign Up — TitleWise</title>
<style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#0a0a0f;color:#e4e4e7;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:2rem}.wrap{width:100%;max-width:400px}.logo{display:flex;align-items:center;gap:8px;margin-bottom:2rem;justify-content:center}.logo b{font-size:1.125rem;color:#fff}.logo span{font-size:1.125rem;font-weight:300;color:#94a3b8}h1{font-size:1.5rem;font-weight:700;text-align:center;margin-bottom:0.5rem}p.sub{text-align:center;color:#64748b;font-size:0.875rem;margin-bottom:2rem}form{display:flex;flex-direction:column;gap:1rem}label{font-size:0.8rem;color:#94a3b8;font-weight:500}input{width:100%;padding:0.75rem 1rem;background:#1e293b;border:1px solid #334155;border-radius:8px;color:#e2e8f0;font-size:0.9rem;outline:none;transition:border-color 0.2s}input:focus{border-color:#2563eb}select{width:100%;padding:0.75rem 1rem;background:#1e293b;border:1px solid #334155;border-radius:8px;color:#e2e8f0;font-size:0.9rem;outline:none}button{margin-top:0.5rem;padding:0.85rem;background:#2563eb;color:#fff;border:none;border-radius:8px;font-size:0.9rem;font-weight:600;cursor:pointer;transition:background 0.2s}button:hover{background:#1d4ed8}.links{text-align:center;margin-top:1.5rem;font-size:0.8rem;color:#64748b}.links a{color:#60a5fa;text-decoration:none}.links a:hover{text-decoration:underline}.divider{display:flex;align-items:center;gap:1rem;margin:1.5rem 0;color:#475569;font-size:0.75rem}.divider::before,.divider::after{content:"";flex:1;height:1px;background:#1e293b}.oauth-btn{display:flex;align-items:center;justify-content:center;gap:0.5rem;padding:0.75rem;background:#1e293b;border:1px solid #334155;border-radius:8px;color:#e2e8f0;font-size:0.85rem;font-weight:500;cursor:pointer;text-decoration:none;transition:border-color 0.2s}.oauth-btn:hover{border-color:#2563eb}</style></head><body>
<div class="wrap">
<div class="logo"><b>TITLE</b><span>wise</span></div>
<h1>Create your account</h1>
<p class="sub">Start analyzing closing documents in minutes</p>
<form action="/api/signup" method="POST">
<div><label>Full name</label><input type="text" name="name" placeholder="Jane Smith" required></div>
<div><label>Work email</label><input type="email" name="email" placeholder="jane@smithlaw.com" required></div>
<div><label>Password</label><input type="password" name="password" placeholder="Min 8 characters" required minlength="8"></div>
<div><label>Firm size</label><select name="firm_size"><option value="solo">Solo practitioner</option><option value="small">2-5 attorneys</option><option value="mid">6-15 attorneys</option><option value="large">16+ attorneys</option></select></div>
<button type="submit">Create account</button>
</form>
<p class="links">Already have an account? <a href="/login">Log in</a></p>
</div></body></html>`, { headers: { "Content-Type": "text/html; charset=utf-8" } });
    }

    if (url.pathname === "/dashboard") {
      return new Response(`<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Dashboard — TitleWise</title>
<style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#0a0a0f;color:#e4e4e7;min-height:100vh}.top{display:flex;align-items:center;justify-content:space-between;padding:1rem 2rem;border-bottom:1px solid #1e293b;background:#0f172a}.top .logo{display:flex;align-items:center;gap:8px;text-decoration:none}.top .logo b{font-size:1rem;color:#fff}.top .logo span{font-size:1rem;font-weight:300;color:#94a3b8}.top .user{display:flex;align-items:center;gap:1rem}.top .user a{color:#64748b;font-size:0.8rem;text-decoration:none}.top .user a:hover{color:#e2e8f0}.main{max-width:1100px;margin:0 auto;padding:2.5rem 2rem}h1{font-size:1.5rem;font-weight:700;margin-bottom:0.5rem}p.sub{color:#64748b;font-size:0.9rem;margin-bottom:2rem}.stats-row{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:1rem;margin-bottom:2.5rem}.stat-card{background:#1e293b;border:1px solid #334155;border-radius:10px;padding:1.25rem}.stat-card .val{font-size:1.75rem;font-weight:700;color:#fff}.stat-card .lbl{font-size:0.75rem;color:#64748b;margin-top:0.25rem}.recent{margin-top:1rem}.recent h2{font-size:1rem;font-weight:600;margin-bottom:1rem;color:#94a3b8}.table{width:100%;border-collapse:collapse}.table th{text-align:left;font-size:0.7rem;text-transform:uppercase;letter-spacing:0.05em;color:#475569;padding:0.75rem;border-bottom:1px solid #1e293b}.table td{padding:0.75rem;font-size:0.85rem;border-bottom:1px solid #1e293b10;color:#e2e8f0}.table tr:hover td{background:#1e293b40}.badge{padding:0.2rem 0.5rem;border-radius:4px;font-size:0.7rem;font-weight:600}.badge.safe{background:#052e16;color:#4ade80;border:1px solid #16a34a40}.badge.risk{background:#7f1d1d;color:#fca5a5;border:1px solid #dc262640}.badge.pending{background:#1e293b;color:#94a3b8;border:1px solid #334155}.actions a{display:inline-block;margin-top:1.5rem;padding:0.7rem 1.5rem;background:#2563eb;color:#fff;border-radius:8px;font-size:0.85rem;font-weight:600;text-decoration:none}.actions a:hover{background:#1d4ed8}</style></head><body>
<div class="top"><a class="logo" href="/"><b>TITLE</b><span>wise</span></a><div class="user"><a href="/try">Analyze</a><a href="/account">Account</a><a href="/login">Log out</a></div></div>
<div class="main">
<h1>Dashboard</h1>
<p class="sub">Your closing analysis activity</p>
<div class="stats-row">
<div class="stat-card"><div class="val">0</div><div class="lbl">Documents analyzed</div></div>
<div class="stat-card"><div class="val">0</div><div class="lbl">Active deals</div></div>
<div class="stat-card"><div class="val">0</div><div class="lbl">Fraud alerts</div></div>
<div class="stat-card"><div class="val">--</div><div class="lbl">Plan</div></div>
</div>
<div class="recent">
<h2>Recent Analyses</h2>
<table class="table"><thead><tr><th>Date</th><th>Document</th><th>Tool</th><th>Result</th></tr></thead><tbody><tr><td colspan="4" style="color:#475569;text-align:center;padding:2rem">No analyses yet. <a href="/try" style="color:#60a5fa">Run your first analysis</a></td></tr></tbody></table>
</div>
<div class="actions"><a href="/try">Analyze a document</a></div>
</div></body></html>`, { headers: { "Content-Type": "text/html; charset=utf-8" } });
    }

    if (url.pathname === "/account") {
      return new Response(`<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Account — TitleWise</title>
<style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#0a0a0f;color:#e4e4e7;min-height:100vh}.top{display:flex;align-items:center;justify-content:space-between;padding:1rem 2rem;border-bottom:1px solid #1e293b;background:#0f172a}.top .logo{display:flex;align-items:center;gap:8px;text-decoration:none}.top .logo b{font-size:1rem;color:#fff}.top .logo span{font-size:1rem;font-weight:300;color:#94a3b8}.top .user{display:flex;align-items:center;gap:1rem}.top .user a{color:#64748b;font-size:0.8rem;text-decoration:none}.top .user a:hover{color:#e2e8f0}.main{max-width:640px;margin:0 auto;padding:2.5rem 2rem}h1{font-size:1.5rem;font-weight:700;margin-bottom:2rem}.section{margin-bottom:2.5rem;padding:1.5rem;background:#1e293b;border:1px solid #334155;border-radius:10px}.section h2{font-size:0.9rem;font-weight:600;margin-bottom:1rem;color:#94a3b8}.field{margin-bottom:1rem}.field label{display:block;font-size:0.75rem;color:#64748b;margin-bottom:0.3rem}.field .value{font-size:0.9rem;color:#e2e8f0}.plan-badge{display:inline-block;padding:0.3rem 0.75rem;background:#2563eb20;border:1px solid #2563eb40;border-radius:6px;font-size:0.8rem;font-weight:600;color:#93c5fd}.btn{display:inline-block;padding:0.6rem 1.2rem;background:#2563eb;color:#fff;border-radius:6px;font-size:0.8rem;font-weight:600;text-decoration:none;border:none;cursor:pointer}.btn:hover{background:#1d4ed8}.btn-outline{background:transparent;border:1px solid #334155;color:#94a3b8}.btn-outline:hover{border-color:#2563eb;color:#e2e8f0}.btn-danger{background:#dc262620;border:1px solid #dc262640;color:#fca5a5}.btn-danger:hover{background:#dc262640}</style></head><body>
<div class="top"><a class="logo" href="/"><b>TITLE</b><span>wise</span></a><div class="user"><a href="/dashboard">Dashboard</a><a href="/try">Analyze</a><a href="/login">Log out</a></div></div>
<div class="main">
<h1>Account Settings</h1>
<div class="section"><h2>Profile</h2><div class="field"><label>Email</label><div class="value">—</div></div><div class="field"><label>Name</label><div class="value">—</div></div><div class="field"><label>Firm</label><div class="value">—</div></div></div>
<div class="section"><h2>Subscription</h2><div class="field"><label>Current plan</label><div class="value"><span class="plan-badge">No active plan</span></div></div><div class="field"><label>Usage this month</label><div class="value">0 documents analyzed</div></div><a href="/#pricing" class="btn">Upgrade plan</a></div>
<div class="section"><h2>API Access</h2><div class="field"><label>API Key</label><div class="value" style="font-family:monospace;font-size:0.8rem;color:#475569">Generate an API key to use TitleWise programmatically</div></div><button class="btn btn-outline">Generate API Key</button></div>
<div class="section"><h2>Danger Zone</h2><button class="btn btn-danger">Delete Account</button></div>
</div></body></html>`, { headers: { "Content-Type": "text/html; charset=utf-8" } });
    }

    if (url.pathname === "/privacy") {
      return new Response(legalPageHTML(baseUrl, "Privacy Policy", "August 25, 2026", `
<p>Boxford Partners LLC (&ldquo;Boxford Partners,&rdquo; &ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo;) operates titlewise.app and the TitleWise platform. This Privacy Policy explains what information we collect, how we use it, and your rights with respect to it.</p>
<h2>Information We Collect</h2>
<p>We collect information you provide directly to us:</p>
<ul><li><strong>Account data</strong> &mdash; name, email address, firm size, and billing information processed through Stripe.</li><li><strong>Documents</strong> &mdash; title commitments, wire instructions, closing disclosures, and HOA documents you submit for analysis. Documents are processed in real-time and not retained beyond the analysis session unless you explicitly save them to a deal file.</li><li><strong>Usage data</strong> &mdash; which tools you use, analysis counts, and interactions within the platform.</li></ul>
<h2>How We Use Your Information</h2>
<ul><li>To analyze documents and deliver results to you only</li><li>To operate, maintain, and improve TitleWise</li><li>To process payments and manage subscriptions</li><li>To send transactional communications (alerts, receipts)</li><li>To comply with legal obligations</li></ul>
<p>We do not use your documents to train AI models. We do not sell personal information.</p>
<h2>Third-Party Service Providers</h2>
<p>We use trusted third-party providers to operate our services. These providers process data only as directed by us:</p>
<ul><li><strong>Cloudflare</strong> &mdash; hosting, CDN, and encrypted object storage (R2)</li><li><strong>Anthropic</strong> &mdash; AI-powered document analysis (receives document text during analysis only)</li><li><strong>Stripe</strong> &mdash; payment processing (we do not store full card numbers)</li><li><strong>Telnyx</strong> &mdash; SMS alert delivery for fraud notifications</li><li><strong>Tavily</strong> &mdash; web verification of entities during analysis</li></ul>
<h2>Data Storage and Security</h2>
<p>All data is encrypted in transit (TLS 1.3) and at rest. Saved documents are stored in Cloudflare R2 (US regions). Account data is stored in Cloudflare D1. No third party receives your full documents outside of the analysis session.</p>
<h2>Data Retention</h2>
<p>We retain your data for as long as your account is active or as needed to provide services. Unsaved documents are discarded immediately after analysis. You may request deletion of all your data at any time from Account settings.</p>
<h2>Your Rights</h2>
<p>Depending on your location, you may have the right to access, correct, delete, or restrict processing of your personal data. To exercise any of these rights, contact us at hello@boxfordpartners.com.</p>

<h2>California Residents &mdash; CCPA/CPRA Notice</h2>
<p>If you are a California resident, the California Consumer Privacy Act (CCPA) as amended by the California Privacy Rights Act (CPRA) provides you with the following rights:</p>
<ul>
<li><strong>Right to Know</strong> &mdash; You may request the categories and specific pieces of personal information we have collected about you in the past 12 months, the categories of sources, the business purpose for collecting it, and the categories of third parties with whom we share it.</li>
<li><strong>Right to Delete</strong> &mdash; You may request deletion of your personal information, subject to certain exceptions (e.g., legal compliance, completing a transaction).</li>
<li><strong>Right to Correct</strong> &mdash; You may request correction of inaccurate personal information.</li>
<li><strong>Right to Opt Out of Sale/Sharing</strong> &mdash; We do not sell or share personal information for cross-context behavioral advertising. No opt-out is required.</li>
<li><strong>Right to Limit Use of Sensitive Personal Information</strong> &mdash; We only use sensitive personal information (such as document contents) for the purposes of providing our services to you.</li>
<li><strong>Non-Discrimination</strong> &mdash; We will not discriminate against you for exercising any of these rights.</li>
</ul>
<p>To submit a verifiable consumer request, email hello@boxfordpartners.com. We will respond within 45 days. You may designate an authorized agent to make a request on your behalf.</p>
<p><strong>Categories of personal information collected in the past 12 months:</strong> Identifiers (name, email), commercial information (subscription plan, payment history), internet/electronic activity (usage logs), and professional information (firm name). We do not collect biometric data.</p>

<h2>Illinois Residents &mdash; BIPA Notice</h2>
<p>TitleWise does not collect, capture, purchase, receive, or otherwise obtain biometric identifiers or biometric information (as defined under the Illinois Biometric Information Privacy Act, 740 ILCS 14) from any user. Our document analysis tools process text only and do not use facial recognition, fingerprint scanning, voiceprints, or any other biometric technology.</p>

<h2>Virginia, Colorado, Connecticut, Utah, and Texas Residents</h2>
<p>If you reside in a state with comprehensive consumer privacy legislation (including the Virginia CDPA, Colorado Privacy Act, Connecticut Data Privacy Act, Utah Consumer Privacy Act, or Texas Data Privacy and Security Act), you have the right to:</p>
<ul>
<li>Confirm whether we process your personal data and access it</li>
<li>Correct inaccuracies in your personal data</li>
<li>Delete your personal data</li>
<li>Obtain a portable copy of your data</li>
<li>Opt out of targeted advertising, sale of personal data, or profiling with legal effects</li>
</ul>
<p>We do not engage in targeted advertising, sell personal data, or profile users for decisions that produce legal or similarly significant effects. To exercise your rights, contact hello@boxfordpartners.com. If we deny your request, you may appeal by replying to our response.</p>

<h2>Children&rsquo;s Privacy</h2>
<p>Our services are not directed to individuals under 18. We do not knowingly collect personal information from minors.</p>
<h2>Changes to This Policy</h2>
<p>We may update this policy from time to time. Material changes will be noted with a new &ldquo;Last updated&rdquo; date. Continued use of our services after changes constitutes acceptance.</p>
<h2>Contact</h2>
<p>Boxford Partners LLC<br><a href="mailto:hello@boxfordpartners.com">hello@boxfordpartners.com</a></p>
`), { headers: { "Content-Type": "text/html; charset=utf-8" } });
    }

    if (url.pathname === "/terms") {
      return new Response(legalPageHTML(baseUrl, "Terms of Service", "August 25, 2026", `
<p>These Terms of Service (&ldquo;Terms&rdquo;) govern your access to and use of TitleWise, operated by Boxford Partners LLC (&ldquo;Boxford Partners,&rdquo; &ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo;). By accessing or using our services, you agree to these Terms.</p>
<h2>Services</h2>
<p>TitleWise provides AI-powered document analysis tools for real estate closing professionals. The service analyzes title commitments, wire instructions, closing disclosures, and HOA documents to surface potential issues for attorney review. We reserve the right to modify, suspend, or discontinue any service at any time with reasonable notice.</p>
<h2>Not Legal Advice</h2>
<p>TitleWise is an analysis tool, not a legal advisor. All output is informational and requires professional judgment before acting. TitleWise does not certify title, guarantee accuracy, or substitute for legal counsel. The attorney of record remains fully responsible for all closing decisions.</p>
<h2>Accounts</h2>
<p>You are responsible for maintaining the security of your account credentials and for all activity that occurs under your account. You must notify us immediately of any unauthorized use. We may suspend or terminate accounts that violate these Terms.</p>
<h2>Acceptable Use</h2>
<p>You agree to use our services only for lawful purposes. You may not:</p>
<ul><li>Submit documents you lack authorization to analyze</li><li>Attempt to reverse-engineer or extract the underlying models</li><li>Use automated tools to scrape results at scale</li><li>Resell access without a written agreement</li><li>Engage in any activity that interferes with the operation of our infrastructure</li></ul>
<h2>Payments and Subscriptions</h2>
<p>Paid services are billed in advance on a monthly basis. All fees are non-refundable except as required by law. We use Stripe to process payments &mdash; your payment information is subject to Stripe&rsquo;s terms and privacy policy. We reserve the right to change pricing with 30 days&rsquo; notice to existing subscribers. You may cancel at any time; access continues through the end of the billing period.</p>
<h2>Intellectual Property</h2>
<p>All content, software, and materials within TitleWise are owned by or licensed to Boxford Partners. You retain ownership of any documents or data you submit to our services.</p>
<h2>Disclaimer of Warranties</h2>
<p>Our services are provided &ldquo;as is&rdquo; and &ldquo;as available&rdquo; without warranties of any kind, express or implied, including but not limited to merchantability, fitness for a particular purpose, or non-infringement.</p>
<h2>Limitation of Liability</h2>
<p>To the fullest extent permitted by law, Boxford Partners shall not be liable for any indirect, incidental, special, consequential, or punitive damages. Our total liability for any claim arising from these Terms shall not exceed the amount you paid us in the twelve months preceding the claim. We are not liable for losses arising from reliance on analysis output without independent verification.</p>
<h2>Governing Law</h2>
<p>These Terms are governed by the laws of the Commonwealth of Massachusetts, without regard to its conflict of law provisions.</p>
<h2>Changes to These Terms</h2>
<p>We may revise these Terms at any time with 30 days&rsquo; notice via email. Continued use of our services after changes take effect constitutes acceptance.</p>
<h2>Contact</h2>
<p>Boxford Partners LLC<br><a href="mailto:hello@boxfordpartners.com">hello@boxfordpartners.com</a></p>
`), { headers: { "Content-Type": "text/html; charset=utf-8" } });
    }

    if (url.pathname === "/pricing") {
      return new Response(legalPageHTML(baseUrl, "Pricing", "", `
<style>
.content{max-width:1060px;padding-top:48px}
.pricing-hero{text-align:center;margin-bottom:48px}
.pricing-hero h1{font-size:clamp(1.75rem,4vw,2.5rem);font-weight:800;letter-spacing:-0.03em;margin-bottom:12px}
.pricing-hero .sub{font-size:1rem;color:var(--muted);max-width:540px;margin:0 auto}
.pricing-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-top:0}
.pricing-grid .card{border:1px solid var(--rule);border-radius:10px;padding:28px 24px;text-decoration:none;display:flex;flex-direction:column;transition:all 0.2s}
.pricing-grid .card.hl{background:rgba(59,130,246,0.08);border-color:rgba(59,130,246,0.25)}
.pricing-grid .card:hover{border-color:rgba(59,130,246,0.25);transform:translateY(-3px);box-shadow:0 8px 24px rgba(0,0,0,0.15)}
.pricing-grid .card .name{font-size:0.8125rem;color:var(--muted);margin-bottom:10px;font-weight:500}
.pricing-grid .card .price{font-size:2rem;font-weight:800;color:var(--text);letter-spacing:-0.03em;line-height:1;margin-bottom:12px}
.pricing-grid .card .price span{font-size:0.875rem;font-weight:400;color:var(--muted)}
.pricing-grid .card .info{font-size:0.8125rem;color:var(--dim);line-height:1.5}
.pricing-grid .card .feat-list{list-style:none;padding:0;margin:16px 0;text-align:left;flex:1}
.pricing-grid .card .feat-list li{font-size:0.8125rem;color:var(--muted);padding:4px 0;border-top:1px solid var(--rule)}
.pricing-grid .card .feat-list li::before{content:"\\2713 ";color:#4ade80;font-weight:700}
.pricing-btn{display:block;width:100%;text-align:center;padding:10px 20px;background:#2563eb;color:#fff !important;border-radius:6px;text-decoration:none !important;font-size:0.8125rem;font-weight:600;transition:background 0.2s;margin-top:auto}
.pricing-btn:hover{background:#1d4ed8;color:#fff !important}
.pricing-faq{margin-top:64px;border-top:1px solid var(--rule);padding-top:48px}
.pricing-faq h2{font-size:1.25rem;font-weight:700;margin-bottom:24px}
.pricing-faq details{border-bottom:1px solid var(--rule)}
.pricing-faq summary{font-size:0.9375rem;font-weight:600;color:var(--text);padding:16px 0;cursor:pointer;list-style:none;display:flex;align-items:center;justify-content:space-between}
.pricing-faq summary::-webkit-details-marker{display:none}
.pricing-faq summary::after{content:"+";font-size:1.25rem;color:var(--muted);font-weight:300;transition:transform 0.2s}
.pricing-faq details[open] summary::after{content:"\\2212"}
.pricing-faq .faq-answer{font-size:0.875rem;color:var(--muted);line-height:1.7;padding:0 0 16px}
@media(max-width:900px){.pricing-grid{grid-template-columns:repeat(2,1fr)}}
@media(max-width:520px){.pricing-grid{grid-template-columns:1fr}}
</style>
<div class="pricing-hero">
  <h1>Simple pricing. No surprises.</h1>
  <p class="sub">One flat monthly rate. All tools included. No per-file fees, no feature gating.</p>
</div>
<div class="pricing-grid">
  <div class="card">
    <p class="name">Solo</p>
    <p class="price">$149<span>/mo</span></p>
    <p class="info">1 attorney &middot; All tools included</p>
    <ul class="feat-list"><li>4 AI analysis tools</li><li>100 docs/month</li><li>Wire fraud detection</li><li>Email support</li></ul>
    <a href="/api/subscribe?plan=solo" class="pricing-btn">Subscribe</a>
  </div>
  <div class="card hl">
    <p class="name">Small Firm</p>
    <p class="price">$349<span>/mo</span></p>
    <p class="info">Up to 5 seats &middot; All tools included</p>
    <ul class="feat-list"><li>Everything in Solo</li><li>500 docs/month</li><li>Multi-agent verification panel</li><li>Deal audit cross-referencing</li><li>Priority support</li></ul>
    <a href="/api/subscribe?plan=small_firm" class="pricing-btn">Subscribe</a>
  </div>
  <div class="card">
    <p class="name">Pro</p>
    <p class="price">$599<span>/mo</span></p>
    <p class="info">Up to 10 seats &middot; Priority support</p>
    <ul class="feat-list"><li>Everything in Small Firm</li><li>Unlimited docs</li><li>Tavily web verification</li><li>County records search</li><li>SMS/voice alerts</li><li>API access</li></ul>
    <a href="/api/subscribe?plan=pro" class="pricing-btn">Subscribe</a>
  </div>
  <div class="card">
    <p class="name">Enterprise</p>
    <p class="price">$999<span>/mo</span></p>
    <p class="info">25 seats &middot; Custom onboarding</p>
    <ul class="feat-list"><li>Everything in Pro</li><li>Dedicated account manager</li><li>Custom integrations</li><li>Fraud pattern database</li><li>SLA guarantee</li><li>SSO/SAML</li></ul>
    <a href="/api/subscribe?plan=enterprise" class="pricing-btn">Contact sales</a>
  </div>
</div>
<div class="pricing-faq">
  <h2>Frequently asked questions</h2>
  <details><summary>What counts as a document?</summary><p class="faq-answer">Any file you upload for analysis: title commitments, closing disclosures, wire instructions, HOA letters. Re-analyzing the same document doesn't count again.</p></details>
  <details><summary>Can I change plans later?</summary><p class="faq-answer">Yes. Upgrade or downgrade anytime. Changes take effect on your next billing cycle with prorated credits.</p></details>
  <details><summary>Is there a free trial?</summary><p class="faq-answer">Try the demo on our homepage at no cost. All paid plans include a 14-day money-back guarantee.</p></details>
  <details><summary>What payment methods do you accept?</summary><p class="faq-answer">All major credit cards via Stripe. Enterprise plans can pay by invoice.</p></details>
  <details><summary>Do you offer annual billing?</summary><p class="faq-answer">Yes. Annual plans save 20%. Contact us for details.</p></details>
</div>
`), { headers: { "Content-Type": "text/html; charset=utf-8" } });
    }

    if (url.pathname === "/blog") {
      return new Response(blogIndexHTML(baseUrl), {
        headers: { "Content-Type": "text/html; charset=utf-8" },
      });
    }

    if (url.pathname.startsWith("/blog/")) {
      const slug = url.pathname.replace("/blog/", "");
      const post = BLOG_POSTS.find(p => p.slug === slug);
      if (post) {
        return new Response(blogPostHTML(post, baseUrl), {
          headers: { "Content-Type": "text/html; charset=utf-8" },
        });
      }
      return new Response("Not found", { status: 404 });
    }

    if (url.pathname === "/api/analyze" && request.method === "POST") {
      const hackathonMode = env.HACKATHON_MODE === "true";
      const authResult = await verifyICToken(request, hackathonMode, env.HACK_SECRET);
      if (!authResult.success) {
        return new Response(JSON.stringify({ error: authResult.error }), {
          status: authResult.status,
          headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
        });
      }

      try {
        const body = await request.json() as { tool: string; document_text: string; property_address?: string; expected_amount?: number; expected_beneficiary?: string };
        const { tool, document_text, property_address, expected_amount, expected_beneficiary } = body;

        if (!document_text || document_text.length < 20) {
          return new Response(JSON.stringify({ error: "Document text too short (min 20 chars)" }), {
            status: 400,
            headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
          });
        }

        let result: unknown;
        switch (tool) {
          case "verify_wire":
            result = await executeVerifyWire({ document_text, expected_amount, expected_beneficiary }, env.TITLEWISE_API_URL, env.ANTHROPIC_API_KEY);
            if ((result as any).analysis && env.ANTHROPIC_API_KEY) {
              const verification = await adversarialVerify((result as any).analysis, document_text, env.ANTHROPIC_API_KEY);
              result = { ...(result as object), adversarial_verification: verification };
            }
            break;
          case "analyze_commitment":
            result = await executeAnalyzeCommitment({ document_text, property_address }, env.TITLEWISE_API_URL, env.ANTHROPIC_API_KEY);
            break;
          case "analyze_closing_disclosure":
            result = await executeAnalyzeCD({ document_text, property_address }, env.TITLEWISE_API_URL, env.ANTHROPIC_API_KEY);
            break;
          case "review_hoa":
            result = await executeReviewHOA({ document_text }, env.TITLEWISE_API_URL, env.ANTHROPIC_API_KEY);
            break;
          default:
            return new Response(JSON.stringify({ error: "Unknown tool" }), {
              status: 400,
              headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
            });
        }

        return new Response(JSON.stringify(result, null, 2), {
          headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
        });
      } catch (e: any) {
        return new Response(JSON.stringify({ error: e.message || "Analysis failed" }), {
          status: 500,
          headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
        });
      }
    }

    if (url.pathname === "/api/analyze" && request.method === "OPTIONS") {
      return new Response(null, {
        headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "POST", "Access-Control-Allow-Headers": "Content-Type" },
      });
    }

    if (url.pathname === "/api/demo-stream" && request.method === "POST") {
      const body = await request.json() as { tool: string; document_text: string };
      const events = getDemoEvents(body.tool);
      const encoder = new TextEncoder();
      const stream = new ReadableStream({
        async start(controller) {
          for (const evt of events) {
            await new Promise(r => setTimeout(r, evt.delay || 150));
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(evt.event)}\n\n`));
          }
          controller.close();
        }
      });
      return new Response(stream, {
        headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache", "Access-Control-Allow-Origin": "*" },
      });
    }

    if (url.pathname === "/api/demo-stream" && request.method === "OPTIONS") {
      return new Response(null, {
        headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "POST", "Access-Control-Allow-Headers": "Content-Type" },
      });
    }

    if (url.pathname === "/api/stream" && request.method === "POST") {
      const hackathonMode = env.HACKATHON_MODE === "true";
      const authResult = await verifyICToken(request, hackathonMode, env.HACK_SECRET);
      if (!authResult.success) {
        return new Response(JSON.stringify({ error: authResult.error }), {
          status: authResult.status,
          headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
        });
      }

      const body = await request.json() as { tool: string; document_text: string };
      const { tool, document_text } = body;

      // x402 Payment Gate — validates Stripe payment receipts in real-time
      if (!hackathonMode) {
        const receipt = await validateReceipt(request.headers.get("X-Payment-Receipt"), env.STRIPE_SECRET_KEY, tool);
        if (!receipt.valid) {
          return build402Response(tool, baseUrl);
        }
      }

      if (!document_text || document_text.length < 20) {
        return new Response(JSON.stringify({ error: "Document text too short" }), {
          status: 400,
          headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
        });
      }

      const { readable, writable } = new TransformStream();
      const writer = writable.getWriter();
      const encoder = new TextEncoder();

      const tenantId = authResult.agentId;
      const pipelineEnv = {
        ANTHROPIC_API_KEY: env.ANTHROPIC_API_KEY,
        TAVILY_API_KEY: env.TAVILY_API_KEY || "",
        MITOSIS_API_KEY: env.MITOSIS_API_KEY || "",
        MITOSIS_OFFICE_ID: env.MITOSIS_OFFICE_ID || "",
        TENANT_ID: tenantId,
      };

      ctx.waitUntil((async () => {
        try {
          const emitFn = (event: any) => {
            const data = JSON.stringify(event);
            writer.write(encoder.encode(`data: ${data}\n\n`));
          };
          let result: any;
          if (tool === "auto") {
            ({ result } = await runMultiPipeline(document_text, pipelineEnv, emitFn, url.origin, tenantId));
          } else {
            ({ result } = await runPipeline(tool, document_text, pipelineEnv, emitFn, url.origin, tenantId));
          }
          writer.write(encoder.encode(`data: ${JSON.stringify({ stage: "final", agent: "Pipeline", status: "complete", message: "done", data: result, elapsed: 0 })}\n\n`));
        } catch (e: any) {
          writer.write(encoder.encode(`data: ${JSON.stringify({ stage: "error", agent: "Pipeline", status: "error", message: e.message, elapsed: 0 })}\n\n`));
        } finally {
          writer.close();
        }
      })());

      return new Response(readable, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          "Connection": "keep-alive",
          "Access-Control-Allow-Origin": "*",
        },
      });
    }

    if (url.pathname === "/api/stream" && request.method === "OPTIONS") {
      return new Response(null, {
        headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "POST", "Access-Control-Allow-Headers": "Content-Type" },
      });
    }

    if (url.pathname === "/api/pricing") {
      return new Response(JSON.stringify(getPricing(), null, 2), {
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      });
    }

    if (url.pathname === "/api/quote") {
      const tool = url.searchParams.get("tool") || "verify_wire";
      const quote = getQuote(tool, baseUrl);
      if (!quote) {
        return new Response(JSON.stringify({ error: "Unknown tool" }), {
          status: 400,
          headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
        });
      }
      return new Response(JSON.stringify(quote, null, 2), {
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      });
    }

    if (url.pathname === "/api/checkout" && (request.method === "GET" || request.method === "POST")) {
      const tool = url.searchParams.get("tool") || "verify_wire";
      if (!env.STRIPE_SECRET_KEY) {
        return new Response(JSON.stringify({ error: "Stripe not configured", hint: "Set STRIPE_SECRET_KEY secret" }), {
          status: 503,
          headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
        });
      }
      const session = await createCheckoutSession(tool, env.STRIPE_SECRET_KEY, baseUrl);
      if ("error" in session) {
        return new Response(JSON.stringify({ error: session.error }), {
          status: 400,
          headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
        });
      }
      // For agents (Accept: application/json), return the URL
      const accept = request.headers.get("Accept") || "";
      if (accept.includes("application/json") || request.method === "POST") {
        return new Response(JSON.stringify({
          checkout_url: session.url,
          session_id: session.session_id,
          tool,
          instructions: "Complete payment at checkout_url, then use header X-Payment-Receipt: stripe:<payment_intent_id>",
        }), {
          headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
        });
      }
      // For browsers, redirect directly to Stripe Checkout
      return Response.redirect(session.url, 303);
    }

    if (url.pathname === "/api/checkout/success") {
      const sessionId = url.searchParams.get("session_id") || "";
      const tool = url.searchParams.get("tool") || "";
      if (!env.STRIPE_SECRET_KEY || !sessionId) {
        return new Response("Missing session", { status: 400 });
      }
      const result = await retrieveCheckoutSession(sessionId, env.STRIPE_SECRET_KEY);
      if (result.paid) {
        return new Response(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>Payment Complete</title><style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:-apple-system,sans-serif;background:#0a0a0f;color:#e4e4e7;display:flex;align-items:center;justify-content:center;min-height:100vh;padding:2rem}.card{background:#052e16;border:1px solid #166534;border-radius:12px;padding:2.5rem;max-width:500px;text-align:center}h1{color:#4ade80;font-size:1.5rem;margin-bottom:1rem}p{color:#94a3b8;line-height:1.6;margin-bottom:1rem}code{background:#1e293b;padding:0.3rem 0.6rem;border-radius:4px;font-size:0.85rem;color:#f4f4f5;display:block;margin:1rem auto;word-break:break-all}a{color:#60a5fa;text-decoration:none}</style></head><body><div class="card"><h1>Payment Successful</h1><p>Your receipt for <strong>${tool}</strong>:</p><code>X-Payment-Receipt: stripe:${result.payment_intent}</code><p style="font-size:0.8rem;color:#64748b;margin-top:1.5rem">Pass this header on your next API call to access the tool.</p><p style="margin-top:1rem"><a href="/try">Back to TitleWise</a></p></div></body></html>`, {
          headers: { "Content-Type": "text/html; charset=utf-8" },
        });
      }
      return new Response(`<!DOCTYPE html><html><head><title>Payment Pending</title></head><body><p>Payment not yet confirmed. Status may be processing.</p></body></html>`, {
        headers: { "Content-Type": "text/html; charset=utf-8" },
      });
    }

    if (url.pathname === "/api/checkout" && request.method === "OPTIONS") {
      return new Response(null, {
        headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET,POST", "Access-Control-Allow-Headers": "Content-Type,Accept" },
      });
    }

    if (url.pathname === "/api/subscribe" && (request.method === "GET" || request.method === "POST")) {
      const plan = url.searchParams.get("plan") || "solo";
      if (!env.STRIPE_SECRET_KEY) {
        return new Response(JSON.stringify({ error: "Stripe not configured" }), {
          status: 503,
          headers: { "Content-Type": "application/json" },
        });
      }
      const session = await createSubscriptionSession(plan, env.STRIPE_SECRET_KEY, baseUrl);
      if ("error" in session) {
        return new Response(JSON.stringify({ error: session.error }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }
      return Response.redirect(session.url, 303);
    }

    if (url.pathname === "/api/subscribe/success") {
      const planRaw = url.searchParams.get("plan") || "";
      const planNames: Record<string, string> = { solo: "Solo", small_firm: "Small Firm", pro: "Pro", enterprise: "Enterprise" };
      const planName = planNames[planRaw] || "Pro";
      return new Response(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>Subscription Active - TitleWise</title><style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:-apple-system,sans-serif;background:#0a0a0f;color:#e4e4e7;display:flex;align-items:center;justify-content:center;min-height:100vh;padding:2rem}.card{background:#052e16;border:1px solid #166534;border-radius:12px;padding:2.5rem;max-width:500px;text-align:center}h1{color:#4ade80;font-size:1.5rem;margin-bottom:1rem}p{color:#94a3b8;line-height:1.6;margin-bottom:1rem}a{color:#60a5fa;text-decoration:none;display:inline-block;margin-top:1rem;padding:10px 24px;background:#2563eb;border-radius:6px;color:#fff}a:hover{background:#1d4ed8}</style></head><body><div class="card"><h1>Welcome to TitleWise ${planName}</h1><p>Your subscription is active. You now have full access to all TitleWise analysis tools.</p><a href="/try">Start analyzing documents</a></div></body></html>`, {
        headers: { "Content-Type": "text/html; charset=utf-8" },
      });
    }

    if (url.pathname === "/api/login" && request.method === "POST") {
      const form = await request.formData();
      const email = form.get("email") as string || "";
      const password = form.get("password") as string || "";
      if (!email || !password) {
        return new Response(`<!DOCTYPE html><html><head><meta charset="utf-8"><meta http-equiv="refresh" content="2;url=/login"><title>Error</title><style>body{font-family:-apple-system,sans-serif;background:#0a0a0f;color:#f87171;display:flex;align-items:center;justify-content:center;min-height:100vh}p{text-align:center}</style></head><body><p>Email and password required. Redirecting...</p></body></html>`, { status: 400, headers: { "Content-Type": "text/html; charset=utf-8" } });
      }
      return Response.redirect(`${baseUrl}/dashboard`, 303);
    }

    if (url.pathname === "/api/signup" && request.method === "POST") {
      const form = await request.formData();
      const name = form.get("name") as string || "";
      const email = form.get("email") as string || "";
      const password = form.get("password") as string || "";
      if (!email || !password || !name) {
        return new Response(`<!DOCTYPE html><html><head><meta charset="utf-8"><meta http-equiv="refresh" content="2;url=/signup"><title>Error</title><style>body{font-family:-apple-system,sans-serif;background:#0a0a0f;color:#f87171;display:flex;align-items:center;justify-content:center;min-height:100vh}p{text-align:center}</style></head><body><p>All fields required. Redirecting...</p></body></html>`, { status: 400, headers: { "Content-Type": "text/html; charset=utf-8" } });
      }
      return Response.redirect(`${baseUrl}/dashboard`, 303);
    }

    if (url.pathname === "/api/auth/google") {
      return Response.redirect(`${baseUrl}/dashboard`, 303);
    }

    if (url.pathname === "/api/upload" && request.method === "POST") {
      try {
        const formData = await request.formData();
        const file = formData.get("file") as File | null;
        const fileNumber = formData.get("fileNumber") as string || `unlinked-${Date.now().toString(36)}`;

        if (!file) {
          return new Response(JSON.stringify({ error: "No file provided" }), {
            status: 400,
            headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
          });
        }

        const key = `${fileNumber}/${file.name}`;
        const rawBytes = await file.arrayBuffer();
        let content: string;

        if (file.type === "application/pdf" || file.name.endsWith(".pdf")) {
          const bytes = new Uint8Array(rawBytes);
          let binary = "";
          for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
          const b64 = btoa(binary);
          const ocrRes = await fetch("https://api.anthropic.com/v1/messages", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-api-key": env.ANTHROPIC_API_KEY,
              "anthropic-version": "2023-06-01",
              "anthropic-beta": "pdfs-2024-09-25",
            },
            body: JSON.stringify({
              model: "claude-sonnet-5",
              max_tokens: 32000,
              messages: [{
                role: "user",
                content: [
                  { type: "document", source: { type: "base64", media_type: "application/pdf", data: b64 } },
                  { type: "text", text: "Extract ALL text from this document exactly as written. Include every field, number, name, date, address, and notation. For handwritten content, transcribe as accurately as possible. Output only the extracted text, no commentary." },
                ],
              }],
            }),
          });
          const ocrData: any = await ocrRes.json();
          const textBlock = ocrData.content?.find((b: any) => b.type === "text");
          if (textBlock?.text) {
            content = textBlock.text;
          } else {
            content = JSON.stringify({ ocr_error: ocrData.error || "No text extracted", raw_type: ocrData.type });
          }
        } else if (file.type.startsWith("image/")) {
          const bytes = new Uint8Array(rawBytes);
          let binary = "";
          for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
          const b64 = btoa(binary);
          const mediaType = file.type as "image/jpeg" | "image/png" | "image/gif" | "image/webp";
          const ocrRes = await fetch("https://api.anthropic.com/v1/messages", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-api-key": env.ANTHROPIC_API_KEY,
              "anthropic-version": "2023-06-01",
            },
            body: JSON.stringify({
              model: "claude-sonnet-5",
              max_tokens: 32000,
              messages: [{
                role: "user",
                content: [
                  { type: "image", source: { type: "base64", media_type: mediaType, data: b64 } },
                  { type: "text", text: "Extract ALL text from this image exactly as written. Include every field, number, name, date, address, and notation. For handwritten content, transcribe as accurately as possible. Output only the extracted text, no commentary." },
                ],
              }],
            }),
          });
          const ocrData: any = await ocrRes.json();
          const textBlock = ocrData.content?.find((b: any) => b.type === "text");
          if (textBlock?.text) {
            content = textBlock.text;
          } else {
            content = new TextDecoder().decode(rawBytes);
          }
        } else {
          content = new TextDecoder().decode(rawBytes);
        }

        // Store in R2 with metadata
        if (env.DOCS_BUCKET) {
          const existing = await env.DOCS_BUCKET.head(key);
          const version = existing ? (parseInt(existing.customMetadata?.version || "0") + 1) : 1;

          // If prior version exists, store it as a versioned backup
          if (existing && version > 1) {
            const priorContent = await env.DOCS_BUCKET.get(key);
            if (priorContent) {
              await env.DOCS_BUCKET.put(`${fileNumber}/.versions/${file.name}.v${version - 1}`, priorContent.body, {
                customMetadata: { version: String(version - 1), superseded_at: new Date().toISOString() },
              });
            }
          }

          await env.DOCS_BUCKET.put(key, rawBytes, {
            customMetadata: {
              version: String(version),
              uploaded_at: new Date().toISOString(),
              file_number: fileNumber,
              original_name: file.name,
              content_type: file.type,
              size: String(rawBytes.byteLength),
              extracted_text_length: String(content.length),
            },
          });

          return new Response(JSON.stringify({
            success: true,
            key,
            version,
            size: rawBytes.byteLength,
            text: content,
            has_prior_version: version > 1,
            ocr: file.type === "application/pdf" || file.name.endsWith(".pdf") || file.type.startsWith("image/"),
          }), {
            headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
          });
        }

        // R2 not available — return text content anyway for pipeline
        return new Response(JSON.stringify({
          success: true,
          key: null,
          version: 1,
          size: rawBytes.byteLength,
          text: content,
          has_prior_version: false,
          ocr: file.type === "application/pdf" || file.name.endsWith(".pdf") || file.type.startsWith("image/"),
          note: "R2 not enabled — document not persisted",
        }), {
          headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
        });
      } catch (e: any) {
        return new Response(JSON.stringify({ error: e.message }), {
          status: 500,
          headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
        });
      }
    }

    if (url.pathname === "/api/upload" && request.method === "OPTIONS") {
      return new Response(null, {
        headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "POST", "Access-Control-Allow-Headers": "Content-Type" },
      });
    }

    if (url.pathname === "/api/documents" && request.method === "GET") {
      const hackathonMode = env.HACKATHON_MODE === "true";
      const authResult = await verifyICToken(request, hackathonMode, env.HACK_SECRET);
      if (!authResult.success) {
        return new Response(JSON.stringify({ error: authResult.error }), {
          status: authResult.status,
          headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
        });
      }

      const agentId = authResult.agentId;

      if (!env.DOCS_BUCKET) {
        return new Response(JSON.stringify({ documents: [], note: "R2 not enabled" }), {
          headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
        });
      }
      const fileNumber = url.searchParams.get("fileNumber");
      if (!fileNumber) {
        return new Response(JSON.stringify({ error: "fileNumber query parameter required" }), {
          status: 400,
          headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
        });
      }
      if (!/^[A-Za-z0-9._-]+$/.test(fileNumber)) {
        return new Response(JSON.stringify({ error: "Invalid fileNumber format" }), {
          status: 400,
          headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
        });
      }
      console.log(`[audit] agent=${agentId} accessed documents for fileNumber=${fileNumber}`);
      const listed = await env.DOCS_BUCKET.list({ prefix: `${fileNumber}/`, limit: 50 });
      const documents = listed.objects
        .filter(obj => !obj.key.includes("/.versions/"))
        .map(obj => ({
          key: obj.key,
          size: obj.size,
          uploaded: obj.uploaded.toISOString(),
          version: obj.customMetadata?.version || "1",
        }));
      return new Response(JSON.stringify({ documents, accessedBy: agentId }), {
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      });
    }

    if (url.pathname === "/api/contacts" && (request.method === "GET" || request.method === "POST")) {
      const hackathonMode = env.HACKATHON_MODE === "true";
      const authResult = await verifyICToken(request, hackathonMode, env.HACK_SECRET);
      if (!authResult.success) {
        return new Response(JSON.stringify({ error: authResult.error }), {
          status: authResult.status,
          headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
        });
      }

      if (!env.DOCS_BUCKET) {
        return new Response(JSON.stringify({ error: "Storage not configured" }), {
          status: 503,
          headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
        });
      }

      const fileNumber = url.searchParams.get("fileNumber");
      if (!fileNumber || !/^[A-Za-z0-9._-]+$/.test(fileNumber)) {
        return new Response(JSON.stringify({ error: "Valid fileNumber query parameter required" }), {
          status: 400,
          headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
        });
      }

      const contactsKey = `contacts/${fileNumber}.json`;

      if (request.method === "GET") {
        const obj = await env.DOCS_BUCKET.get(contactsKey);
        const contacts = obj ? await obj.json() : {};
        return new Response(JSON.stringify({ fileNumber, contacts }), {
          headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
        });
      }

      // POST: upsert contacts for a deal
      const body = await request.json() as {
        contacts: Record<string, { name: string; phone: string; email?: string }>;
      };
      if (!body.contacts || typeof body.contacts !== "object") {
        return new Response(JSON.stringify({ error: "Body must include contacts object with role keys" }), {
          status: 400,
          headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
        });
      }

      const validRoles = ["buyer_agent", "seller_agent", "lender", "closing_attorney", "title_officer"];
      const cleaned: Record<string, { name: string; phone: string; email?: string }> = {};
      for (const [role, info] of Object.entries(body.contacts)) {
        if (!validRoles.includes(role)) continue;
        if (!info.phone || !/^\+?[0-9]{10,15}$/.test(info.phone.replace(/[\s()-]/g, ""))) continue;
        cleaned[role] = { name: info.name || role, phone: info.phone.replace(/[\s()-]/g, ""), email: info.email };
      }

      // Merge with existing contacts
      const existing = await env.DOCS_BUCKET.get(contactsKey);
      const merged = existing ? { ...(await existing.json() as object), ...cleaned } : cleaned;
      await env.DOCS_BUCKET.put(contactsKey, JSON.stringify(merged));
      console.log(`[audit] agent=${authResult.agentId} updated contacts for fileNumber=${fileNumber} roles=${Object.keys(cleaned).join(",")}`);
      return new Response(JSON.stringify({ fileNumber, contacts: merged, updated: Object.keys(cleaned) }), {
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      });
    }

    if (url.pathname === "/api/contacts" && request.method === "OPTIONS") {
      return new Response(null, {
        headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET, POST", "Access-Control-Allow-Headers": "Content-Type, Authorization" },
      });
    }

    if (url.pathname === "/api/notify" && request.method === "POST") {
      const hackathonMode = env.HACKATHON_MODE === "true";
      const authResult = await verifyICToken(request, hackathonMode, env.HACK_SECRET);
      if (!authResult.success) {
        return new Response(JSON.stringify({ error: authResult.error }), {
          status: authResult.status,
          headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
        });
      }

      console.log(`[audit] agent=${authResult.agentId} triggered notification`);
      try {
        const body = await request.json() as NotifyRequest & { mode?: "sms" | "voice" | "both" };
        const telnyxEnv = {
          TELNYX_API_KEY: env.TELNYX_API_KEY || "",
          TELNYX_PHONE_NUMBER: env.TELNYX_PHONE_NUMBER || "",
          TELNYX_MESSAGING_PROFILE_ID: env.TELNYX_MESSAGING_PROFILE_ID || "",
          TELNYX_CALL_CONTROL_APP_ID: env.TELNYX_CALL_CONTROL_APP_ID || "",
          DEMO_NOTIFY_PHONE: env.DEMO_NOTIFY_PHONE || "",
        };

        if (!telnyxEnv.TELNYX_API_KEY) {
          return new Response(JSON.stringify({
            success: false,
            error: "Telnyx not configured. Set TELNYX_API_KEY secret.",
            simulated: true,
            message: `[SIMULATED] Would send ${body.mode || "sms"} notification for action: ${body.action}`,
          }), {
            headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
          });
        }

        // Look up deal contacts from R2 to resolve recipient(s) by role
        let contacts: Record<string, { name: string; phone: string }> | null = null;
        if (env.DOCS_BUCKET && body.dealInfo?.fileNumber) {
          const contactsObj = await env.DOCS_BUCKET.get(`contacts/${body.dealInfo.fileNumber}.json`);
          if (contactsObj) {
            contacts = await contactsObj.json() as Record<string, { name: string; phone: string }>;
          }
        }

        // hold_all_parties fans out to every registered contact
        if (body.action === "hold_all_parties" && contacts) {
          const allPhones = Object.values(contacts).map(c => c.phone).filter(Boolean);
          if (allPhones.length === 0) {
            const result = await handleNotification(body, telnyxEnv, body.mode || "sms");
            return new Response(JSON.stringify({ success: true, ...result }), {
              headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
            });
          }
          const results = await Promise.all(
            allPhones.map(phone => handleNotification(body, telnyxEnv, body.mode || "sms", phone))
          );
          const sent = results.filter(r => r.sms?.success || r.voice?.success).length;
          return new Response(JSON.stringify({
            success: sent > 0,
            totalRecipients: allPhones.length,
            sent,
            failed: allPhones.length - sent,
            details: results.map((r, i) => ({ phone: allPhones[i], ...r })),
          }), {
            headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
          });
        }

        // Single-recipient actions
        const roleMap: Record<string, string> = {
          notify_buyer_agent: "buyer_agent",
          notify_seller_agent: "seller_agent",
          send_to_lender: "lender",
          escalate_compliance: "closing_attorney",
        };
        const targetRole = roleMap[body.action];
        const recipientPhone = (targetRole && contacts?.[targetRole]?.phone) || undefined;

        const result = await handleNotification(body, telnyxEnv, body.mode || "sms", recipientPhone);
        return new Response(JSON.stringify({ success: true, ...result }), {
          headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
        });
      } catch (e: any) {
        return new Response(JSON.stringify({ success: false, error: e.message }), {
          status: 500,
          headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
        });
      }
    }

    if ((url.pathname === "/api/notify" || url.pathname === "/api/telnyx-webhook") && request.method === "OPTIONS") {
      return new Response(null, {
        headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "POST", "Access-Control-Allow-Headers": "Content-Type" },
      });
    }

    if (url.pathname === "/api/telnyx-webhook" && request.method === "POST") {
      const webhookBody: any = await request.json();
      const eventType = webhookBody?.data?.event_type;
      const callControlId = webhookBody?.data?.payload?.call_control_id;

      if (eventType === "call.answered" && callControlId) {
        const { pendingTTS } = await import("./notifications");
        const pending = pendingTTS.get(callControlId);
        if (pending) {
          pendingTTS.delete(callControlId);
          ctx.waitUntil(fetch(`https://api.telnyx.com/v2/calls/${callControlId}/actions/speak`, {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${pending.apiKey}` },
            body: JSON.stringify({ payload: pending.message, voice: "female", language: "en-US" }),
          }));
        }
      }

      return new Response(JSON.stringify({ ok: true }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    if (url.pathname === "/cotal" || url.pathname === "/.well-known/agent.json") {
      return new Response(JSON.stringify(getCotalManifest(baseUrl), null, 2), {
        headers: { "Content-Type": "application/json" },
      });
    }

    if (url.pathname === "/.well-known/agent-card.json") {
      const agentCard = {
        name: "TitleWise",
        description: "Real estate document intelligence agent. Analyzes title commitments, verifies wire instructions, reviews closing disclosures, and audits HOA documents.",
        url: baseUrl,
        version: "1.0.0",
        capabilities: {
          streaming: true,
          pushNotifications: false,
          stateTransitionHistory: false,
        },
        authentication: {
          schemes: ["bearer"],
          credentials: "IC agent token (agt_...) with scope titlewise:analyze or titlewise:read",
        },
        defaultInputModes: ["text", "application/pdf"],
        defaultOutputModes: ["text", "application/json"],
        skills: [
          { id: "analyze_commitment", name: "Analyze Title Commitment", description: "Multi-agent panel reviews a title commitment for risks, exceptions, and red flags" },
          { id: "verify_wire", name: "Verify Wire Instructions", description: "Adversarial verification of wire transfer instructions for fraud indicators" },
          { id: "analyze_closing_disclosure", name: "Analyze Closing Disclosure", description: "Reviews closing disclosure for fee accuracy, tolerance violations, and missing items" },
          { id: "review_hoa", name: "Review HOA Documents", description: "Analyzes HOA estoppel letters and covenants for financial and compliance risks" },
        ],
      };
      return new Response(JSON.stringify(agentCard, null, 2), {
        headers: { "Content-Type": "application/json" },
      });
    }

    if (url.pathname === "/mcp.json") {
      const mcpDiscovery = {
        name: "TitleWise Agent",
        description: "Real estate document intelligence via MCP",
        transport: {
          type: "streamable-http",
          url: `${baseUrl}/mcp`,
        },
        authentication: {
          type: "bearer",
          description: "IC agent token (agt_...) required. Scopes: titlewise:analyze, titlewise:read",
        },
        tools: [
          { name: "analyze_commitment", description: "Analyze a title commitment document" },
          { name: "verify_wire", description: "Verify wire transfer instructions for fraud" },
          { name: "analyze_closing_disclosure", description: "Review a closing disclosure" },
          { name: "review_hoa", description: "Analyze HOA documents" },
          { name: "recall", description: "Retrieve prior analysis from agent memory" },
        ],
      };
      return new Response(JSON.stringify(mcpDiscovery, null, 2), {
        headers: { "Content-Type": "application/json" },
      });
    }

    // Auth required for MCP endpoints
    if (url.pathname === "/sse" || url.pathname === "/mcp") {
      const hackathonMode = env.HACKATHON_MODE === "true";
      const authResult = await verifyICToken(request, hackathonMode, env.HACK_SECRET);
      if (!authResult.success) {
        return new Response(JSON.stringify({ error: authResult.error }), {
          status: authResult.status,
          headers: { "Content-Type": "application/json" },
        });
      }

      if (url.pathname === "/mcp") {
        return TitleWiseAgent.serve("/mcp", { binding: "TITLEWISE_AGENT" }).fetch(request, env, ctx);
      }
      return TitleWiseAgent.serveSSE("/sse", { binding: "TITLEWISE_AGENT" }).fetch(request, env, ctx);
    }

    return new Response("Not found", { status: 404 });
  },
} satisfies ExportedHandler<Env>;
