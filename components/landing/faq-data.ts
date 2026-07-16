export const faqs = [
  // ── Product ────────────────────────────────────────────────────────────
  {
    value: "what",
    category: "Product",
    featured: true,
    question: "What is TitleWise?",
    answer: "TitleWise is an AI-powered closing platform built specifically for real estate attorneys. It combines seven document analysis tools, an autonomous closing coordinator agent, client portals, TRID compliance checks, and wire fraud protection — so you can close faster with fewer errors.",
  },
  {
    value: "tools",
    category: "Product",
    featured: true,
    question: "Which tools are included?",
    answer: "Every plan includes seven core tools: Status Update Generator, Title Commitment Analyzer, Closing Disclosure Reviewer, Wire Fraud Prevention, HOA Document Reviewer, Fee Estimate Generator, and Tax Proration Calculator. Higher plans add the Autonomous Closing Agent, Client Matter Portal, and Wire Fraud Memory.",
  },
  {
    value: "vs-production",
    category: "Product",
    featured: true,
    question: "How is TitleWise different from Qualia or SoftPro?",
    answer: "Qualia, SoftPro, and similar platforms manage the production pipeline: escrow, title orders, scheduling, and closing workflow. They are not built to review documents. TitleWise is specifically built for examination intelligence — analyzing the content of title commitments, HUDs, closing disclosures, deeds, and other documents for issues that require attorney attention. The two categories of software solve different problems.",
  },
  {
    value: "agent",
    category: "Product",
    featured: false,
    question: "What does the AI closing agent do?",
    answer: "The autonomous closing coordinator analyzes your entire matter, auto-updates checklist items as they complete, drafts status update emails, and flags potential issues — all without you lifting a finger. Available on Pro and Enterprise plans.",
  },
  {
    value: "portal",
    category: "Product",
    featured: false,
    question: "How does the client portal work?",
    answer: "Share a secure link with your client and they can track checklist progress, closing status, and key milestones in real time. No login required for clients — just a unique, secure URL. Available on Small Firm plans and above.",
  },
  {
    value: "ai-automate",
    category: "Product",
    featured: false,
    question: "What parts of title review can AI actually automate?",
    answer: "The pattern work. Checking standard exceptions on a title commitment, flagging inconsistent fields on closing disclosures, verifying deed descriptions against legal descriptions, identifying gaps in the chain of title. These tasks follow predictable patterns and can be handled in seconds. What still requires an attorney is the judgment work: evaluating whether an exception is material, interpreting unusual easements, advising clients on risk, and making certification decisions.",
  },
  {
    value: "pattern-work",
    category: "Product",
    featured: false,
    question: "What is pattern work in title examination?",
    answer: "Pattern work is the portion of title examination that follows predictable, repeatable rules: verifying that required fields are present and consistent, checking that standard exceptions match the property type, confirming that legal descriptions align across documents. It accounts for the majority of examination time but requires no legal judgment. AI handles pattern work well. Judgment calls still belong to the attorney.",
  },
  {
    value: "how-long",
    category: "Product",
    featured: false,
    question: "How long does title document review actually take?",
    answer: "For a typical residential closing, most attorneys spend two to four hours reviewing documents across seven or more document types. The majority of that time is pattern-based work that repeats across every file. TitleWise handles that layer in seconds and surfaces only the anomalies that need attorney attention.",
  },
  {
    value: "states",
    category: "Product",
    featured: false,
    question: "Which states are supported?",
    answer: "TitleWise includes state-specific checklist templates for NH, MA, NY, CA, FL, TX, and PA, with more states being added regularly. The document analysis tools work with closings in all 50 states.",
  },
  {
    value: "integration",
    category: "Product",
    featured: false,
    question: "Does it integrate with my existing workflow?",
    answer: "Yes. TitleWise works alongside your current tools. Upload documents in standard formats (PDF, DOCX), review AI-generated insights, and export results as polished PDFs ready for clients or co-counsel.",
  },

  // ── Accuracy & AI ──────────────────────────────────────────────────────
  {
    value: "accuracy",
    category: "Accuracy & AI",
    featured: true,
    question: "How accurate is AI for reviewing closing documents?",
    answer: "For pattern-based review — detecting missing fields, flagging standard exceptions, identifying inconsistencies between documents — AI is highly reliable. For judgment calls that require legal interpretation, the attorney stays in the loop. TitleWise is designed to handle the former and surface the latter, not to replace attorney judgment on complex decisions.",
  },
  {
    value: "ai-replace",
    category: "Accuracy & AI",
    featured: false,
    question: "Will AI replace title attorneys?",
    answer: "No. AI handles the repetitive, rules-based layer of title examination. The judgment work — evaluating risk, interpreting unusual easements, certifying title, advising clients — requires legal expertise and professional responsibility that no AI can substitute. TitleWise is built to make attorneys more productive, not to replace them.",
  },
  {
    value: "ai-mistakes",
    category: "Accuracy & AI",
    featured: false,
    question: "What happens if the AI makes a mistake?",
    answer: "TitleWise surfaces findings for attorney review — it does not make final decisions. Every output is reviewed by the attorney before any action is taken. The attorney remains responsible for certification, and the platform is designed to assist that judgment, not bypass it.",
  },

  // ── Security & Privacy ─────────────────────────────────────────────────
  {
    value: "security",
    category: "Security & Privacy",
    featured: true,
    question: "Is my client data secure?",
    answer: "Yes. All data is encrypted in transit and at rest. We never share or sell your information. TitleWise is built with the security and confidentiality standards real estate attorneys require.",
  },
  {
    value: "confidentiality",
    category: "Security & Privacy",
    featured: false,
    question: "Does TitleWise train AI models on my documents?",
    answer: "No. Your documents are processed to generate analysis for your matter only. They are never used to train AI models or shared with any third party.",
  },

  // ── Pricing & Plans ────────────────────────────────────────────────────
  {
    value: "cancel",
    category: "Pricing & Plans",
    featured: true,
    question: "Can I cancel anytime?",
    answer: "Yes. There are no long-term contracts or cancellation fees. You can cancel at any time and retain access through the end of your current billing period.",
  },
  {
    value: "trial",
    category: "Pricing & Plans",
    featured: false,
    question: "Is there a free trial?",
    answer: "Yes. You can get started with TitleWise and explore the platform before committing to a paid plan. No credit card required to begin.",
  },
  {
    value: "plans",
    category: "Pricing & Plans",
    featured: false,
    question: "Which plan is right for a solo attorney?",
    answer: "The Solo plan at $149/month is built for solo practitioners and small practices. It includes all seven core AI tools and unlimited matters. The Small Firm plan adds client portals and team seats for attorneys with support staff.",
  },
  {
    value: "upgrade",
    category: "Pricing & Plans",
    featured: false,
    question: "Can I upgrade or downgrade my plan?",
    answer: "Yes. You can change your plan at any time. Upgrades take effect immediately. Downgrades take effect at the start of your next billing cycle.",
  },
]

export const featuredFaqs = faqs.filter((f) => f.featured)
