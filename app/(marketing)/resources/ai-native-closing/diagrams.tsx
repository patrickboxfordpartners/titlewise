"use client";

export function WorkflowDiagram() {
  return (
    <svg
      viewBox="0 0 800 400"
      style={{
        width: "100%",
        maxWidth: 800,
        height: "auto",
        margin: "48px auto",
        display: "block",
      }}
    >
      <defs>
        <linearGradient id="primaryGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#533afd" stopOpacity="1" />
          <stop offset="100%" stopColor="#665efd" stopOpacity="1" />
        </linearGradient>
      </defs>

      {/* Traditional Side */}
      <text x="200" y="30" textAnchor="middle" fontSize="14" fontWeight="400" fill="#0d253d" letterSpacing="0.08em">
        TRADITIONAL
      </text>

      {/* Email/Fax */}
      <rect x="60" y="60" width="280" height="60" rx="12" fill="#f6f9fc" stroke="#e3e8ee" strokeWidth="1" />
      <text x="200" y="90" textAnchor="middle" fontSize="13" fontWeight="300" fill="#0d253d">
        Email &amp; Fax Coordination
      </text>
      <text x="200" y="108" textAnchor="middle" fontSize="11" fontWeight="300" fill="#64748d">
        200+ emails, phone tag, manual tracking
      </text>

      {/* Arrow down */}
      <path d="M 200 130 L 200 155" stroke="#e3e8ee" strokeWidth="2" fill="none" />
      <path d="M 200 155 L 196 148 M 200 155 L 204 148" stroke="#e3e8ee" strokeWidth="2" fill="none" />

      {/* Manual Review */}
      <rect x="60" y="165" width="280" height="60" rx="12" fill="#f6f9fc" stroke="#e3e8ee" strokeWidth="1" />
      <text x="200" y="195" textAnchor="middle" fontSize="13" fontWeight="300" fill="#0d253d">
        Manual Document Review
      </text>
      <text x="200" y="213" textAnchor="middle" fontSize="11" fontWeight="300" fill="#64748d">
        Spreadsheets, post-its, memory
      </text>

      {/* Arrow down */}
      <path d="M 200 235 L 200 260" stroke="#e3e8ee" strokeWidth="2" fill="none" />
      <path d="M 200 260 L 196 253 M 200 260 L 204 253" stroke="#e3e8ee" strokeWidth="2" fill="none" />

      {/* Compliance Risk */}
      <rect x="60" y="270" width="280" height="60" rx="12" fill="#f6f9fc" stroke="#e3e8ee" strokeWidth="1" />
      <text x="200" y="300" textAnchor="middle" fontSize="13" fontWeight="300" fill="#0d253d">
        Compliance Risk
      </text>
      <text x="200" y="318" textAnchor="middle" fontSize="11" fontWeight="300" fill="#64748d">
        Wire fraud, TRID violations, errors
      </text>

      {/* AI-Native Side */}
      <text x="600" y="30" textAnchor="middle" fontSize="14" fontWeight="400" fill="#533afd" letterSpacing="0.08em">
        AI-NATIVE
      </text>

      {/* Intake */}
      <rect x="460" y="60" width="280" height="60" rx="12" fill="url(#primaryGrad)" stroke="none" />
      <text x="600" y="90" textAnchor="middle" fontSize="13" fontWeight="300" fill="#ffffff">
        Agent Pipeline: Intake
      </text>
      <text x="600" y="108" textAnchor="middle" fontSize="11" fontWeight="300" fill="#ffffff" opacity="0.9">
        Document ingestion, routing
      </text>

      {/* Arrow down */}
      <path d="M 600 130 L 600 155" stroke="#533afd" strokeWidth="2" fill="none" />
      <path d="M 600 155 L 596 148 M 600 155 L 604 148" stroke="#533afd" strokeWidth="2" fill="none" />

      {/* Analyze + Verify */}
      <rect x="460" y="165" width="280" height="60" rx="12" fill="url(#primaryGrad)" stroke="none" />
      <text x="600" y="195" textAnchor="middle" fontSize="13" fontWeight="300" fill="#ffffff">
        Analyze + Adversarial Verify
      </text>
      <text x="600" y="213" textAnchor="middle" fontSize="11" fontWeight="300" fill="#ffffff" opacity="0.9">
        Title, CD, wire, HOA checks
      </text>

      {/* Arrow down */}
      <path d="M 600 235 L 600 260" stroke="#533afd" strokeWidth="2" fill="none" />
      <path d="M 600 260 L 596 253 M 600 260 L 604 253" stroke="#533afd" strokeWidth="2" fill="none" />

      {/* Close */}
      <rect x="460" y="270" width="280" height="60" rx="12" fill="url(#primaryGrad)" stroke="none" />
      <text x="600" y="300" textAnchor="middle" fontSize="13" fontWeight="300" fill="#ffffff">
        Coordinate &amp; Close
      </text>
      <text x="600" y="318" textAnchor="middle" fontSize="11" fontWeight="300" fill="#ffffff" opacity="0.9">
        Auto-status, alerts, compliance gates
      </text>
    </svg>
  );
}

export function ArchitectureDiagram() {
  return (
    <svg
      viewBox="0 0 800 500"
      style={{
        width: "100%",
        maxWidth: 800,
        height: "auto",
        margin: "48px auto",
        display: "block",
      }}
    >
      <defs>
        <linearGradient id="primaryGradArch" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#533afd" stopOpacity="1" />
          <stop offset="100%" stopColor="#665efd" stopOpacity="1" />
        </linearGradient>
      </defs>

      {/* Center: MCP Gateway */}
      <rect x="300" y="200" width="200" height="100" rx="12" fill="url(#primaryGradArch)" stroke="none" />
      <text x="400" y="240" textAnchor="middle" fontSize="16" fontWeight="300" fill="#ffffff" letterSpacing="-0.2px">
        MCP Gateway
      </text>
      <text x="400" y="260" textAnchor="middle" fontSize="11" fontWeight="300" fill="#ffffff" opacity="0.9">
        titlewise-agent
      </text>

      {/* Top Left: analyze_commitment */}
      <rect x="80" y="60" width="160" height="70" rx="8" fill="#f6f9fc" stroke="#533afd" strokeWidth="2" />
      <text x="160" y="90" textAnchor="middle" fontSize="13" fontWeight="300" fill="#0d253d">
        analyze_commitment
      </text>
      <text x="160" y="108" textAnchor="middle" fontSize="10" fontWeight="300" fill="#64748d">
        Title analysis
      </text>
      {/* Connection line */}
      <path d="M 240 95 Q 270 95 300 200" stroke="#533afd" strokeWidth="1.5" fill="none" strokeDasharray="4 2" />

      {/* Top Right: verify_wire */}
      <rect x="560" y="60" width="160" height="70" rx="8" fill="#f6f9fc" stroke="#533afd" strokeWidth="2" />
      <text x="640" y="90" textAnchor="middle" fontSize="13" fontWeight="300" fill="#0d253d">
        verify_wire
      </text>
      <text x="640" y="108" textAnchor="middle" fontSize="10" fontWeight="300" fill="#64748d">
        Adversarial check
      </text>
      {/* Connection line */}
      <path d="M 560 95 Q 530 95 500 200" stroke="#533afd" strokeWidth="1.5" fill="none" strokeDasharray="4 2" />

      {/* Middle Left: analyze_closing_disclosure */}
      <rect x="50" y="215" width="160" height="70" rx="8" fill="#f6f9fc" stroke="#533afd" strokeWidth="2" />
      <text x="130" y="245" textAnchor="middle" fontSize="13" fontWeight="300" fill="#0d253d">
        analyze_closing_
      </text>
      <text x="130" y="258" textAnchor="middle" fontSize="13" fontWeight="300" fill="#0d253d">
        disclosure
      </text>
      {/* Connection line */}
      <path d="M 210 250 L 300 250" stroke="#533afd" strokeWidth="1.5" fill="none" strokeDasharray="4 2" />

      {/* Middle Right: review_hoa */}
      <rect x="590" y="215" width="160" height="70" rx="8" fill="#f6f9fc" stroke="#533afd" strokeWidth="2" />
      <text x="670" y="245" textAnchor="middle" fontSize="13" fontWeight="300" fill="#0d253d">
        review_hoa
      </text>
      <text x="670" y="263" textAnchor="middle" fontSize="10" fontWeight="300" fill="#64748d">
        HOA documents
      </text>
      {/* Connection line */}
      <path d="M 590 250 L 500 250" stroke="#533afd" strokeWidth="1.5" fill="none" strokeDasharray="4 2" />

      {/* Bottom: recall */}
      <rect x="320" y="380" width="160" height="70" rx="8" fill="#f6f9fc" stroke="#533afd" strokeWidth="2" />
      <text x="400" y="410" textAnchor="middle" fontSize="13" fontWeight="300" fill="#0d253d">
        recall
      </text>
      <text x="400" y="428" textAnchor="middle" fontSize="10" fontWeight="300" fill="#64748d">
        Memory retrieval
      </text>
      {/* Connection line */}
      <path d="M 400 380 L 400 300" stroke="#533afd" strokeWidth="1.5" fill="none" strokeDasharray="4 2" />

      {/* Adversarial Verification Layer */}
      <rect x="200" y="350" width="400" height="40" rx="6" fill="#f5e9d4" stroke="#9b6829" strokeWidth="1" />
      <text x="400" y="375" textAnchor="middle" fontSize="12" fontWeight="400" fill="#9b6829" letterSpacing="0.05em">
        Adversarial Verification Layer
      </text>
    </svg>
  );
}

export function TimelineComparison() {
  return (
    <svg
      viewBox="0 0 800 350"
      style={{
        width: "100%",
        maxWidth: 800,
        height: "auto",
        margin: "48px auto",
        display: "block",
      }}
    >
      {/* Traditional Timeline */}
      <text x="50" y="30" fontSize="14" fontWeight="400" fill="#0d253d" letterSpacing="0.08em">
        TRADITIONAL (45 days)
      </text>

      {/* Timeline bar */}
      <line x1="50" y1="80" x2="750" y2="80" stroke="#e3e8ee" strokeWidth="4" />

      {/* Day markers */}
      <circle cx="50" cy="80" r="6" fill="#64748d" />
      <text x="50" y="105" textAnchor="middle" fontSize="10" fontWeight="300" fill="#64748d">Day 0</text>
      <text x="50" y="120" textAnchor="middle" fontSize="9" fontWeight="300" fill="#64748d">File open</text>

      <circle cx="240" cy="80" r="6" fill="#ea2261" />
      <text x="240" y="55" textAnchor="middle" fontSize="10" fontWeight="300" fill="#ea2261">Day 12</text>
      <text x="240" y="70" textAnchor="middle" fontSize="9" fontWeight="300" fill="#ea2261">CD error</text>

      <circle cx="430" cy="80" r="6" fill="#ea2261" />
      <text x="430" y="105" textAnchor="middle" fontSize="10" fontWeight="300" fill="#ea2261">Day 25</text>
      <text x="430" y="120" textAnchor="middle" fontSize="9" fontWeight="300" fill="#ea2261">Wire delay</text>

      <circle cx="620" cy="80" r="6" fill="#ea2261" />
      <text x="620" y="55" textAnchor="middle" fontSize="10" fontWeight="300" fill="#ea2261">Day 38</text>
      <text x="620" y="70" textAnchor="middle" fontSize="9" fontWeight="300" fill="#ea2261">Title fix</text>

      <circle cx="750" cy="80" r="6" fill="#64748d" />
      <text x="750" y="105" textAnchor="middle" fontSize="10" fontWeight="300" fill="#64748d">Day 45</text>
      <text x="750" y="120" textAnchor="middle" fontSize="9" fontWeight="300" fill="#64748d">Close</text>

      {/* AI-Native Timeline */}
      <text x="50" y="190" fontSize="14" fontWeight="400" fill="#533afd" letterSpacing="0.08em">
        AI-NATIVE (45 days)
      </text>

      {/* Timeline bar */}
      <line x1="50" y1="240" x2="750" y2="240" stroke="#533afd" strokeWidth="4" />

      {/* Day markers */}
      <circle cx="50" cy="240" r="6" fill="#533afd" />
      <text x="50" y="265" textAnchor="middle" fontSize="10" fontWeight="300" fill="#533afd">Day 0</text>
      <text x="50" y="280" textAnchor="middle" fontSize="9" fontWeight="300" fill="#533afd">Auto-analyze</text>

      <circle cx="240" cy="240" r="6" fill="#533afd" />
      <text x="240" y="215" textAnchor="middle" fontSize="10" fontWeight="300" fill="#533afd">Day 12</text>
      <text x="240" y="230" textAnchor="middle" fontSize="9" fontWeight="300" fill="#533afd">CD verified</text>

      <circle cx="430" cy="240" r="6" fill="#533afd" />
      <text x="430" y="265" textAnchor="middle" fontSize="10" fontWeight="300" fill="#533afd">Day 25</text>
      <text x="430" y="280" textAnchor="middle" fontSize="9" fontWeight="300" fill="#533afd">Wire cleared</text>

      <circle cx="620" cy="240" r="6" fill="#533afd" />
      <text x="620" y="215" textAnchor="middle" fontSize="10" fontWeight="300" fill="#533afd">Day 38</text>
      <text x="620" y="230" textAnchor="middle" fontSize="9" fontWeight="300" fill="#533afd">Auto-status</text>

      <circle cx="750" cy="240" r="6" fill="#533afd" />
      <text x="750" y="265" textAnchor="middle" fontSize="10" fontWeight="300" fill="#533afd">Day 45</text>
      <text x="750" y="280" textAnchor="middle" fontSize="9" fontWeight="300" fill="#533afd">Close</text>

      {/* Summary text */}
      <text x="400" y="320" textAnchor="middle" fontSize="12" fontWeight="300" fill="#64748d">
        Same timeline, 80% less manual coordination
      </text>
    </svg>
  );
}
