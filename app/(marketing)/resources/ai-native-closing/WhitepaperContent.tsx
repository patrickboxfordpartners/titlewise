"use client";

import { WorkflowDiagram, ArchitectureDiagram, TimelineComparison } from "./diagrams";

export function WhitepaperContent() {
  return (
    <article className="max-w-none" style={{ fontFamily: "var(--font-sans)" }}>
      {/* Section 1: The current state */}
      <h2
        style={{
          fontSize: "clamp(1.5rem, 3vw, 2rem)",
          fontWeight: 300,
          letterSpacing: "-0.8px",
          color: "var(--foreground)",
          marginTop: 48,
          marginBottom: 16,
        }}
      >
        Closings Still Run on Email and Fax
      </h2>
      <p
        style={{
          fontSize: "1.0625rem",
          lineHeight: 1.7,
          color: "var(--foreground)",
          opacity: 0.85,
          marginBottom: 16,
        }}
      >
        The average residential real estate closing in 2026 involves between 160 and 220 email
        messages, 18 to 25 phone calls, and anywhere from 4 to 9 fax transmissions. These numbers
        come from ALTA operational surveys and NAR workflow studies, and they have not improved in a
        decade. The coordination burden on title attorneys and closing coordinators has grown heavier
        as compliance regimes have tightened, but the tools have not kept pace.
      </p>
      <p
        style={{
          fontSize: "1.0625rem",
          lineHeight: 1.7,
          color: "var(--foreground)",
          opacity: 0.85,
          marginBottom: 16,
        }}
      >
        TRID introduced the three-day disclosure rule in 2015. That deadline is non-negotiable, and
        missing it means delaying the close. Yet the workflow for assembling, reviewing, and
        delivering the Closing Disclosure is still manual. A coordinator receives the seller
        statement, the buyer statement, the title commitment, the payoff demands, and the HOA
        documents, all in different formats, from different systems, via different channels. She
        cross-checks line items in a spreadsheet. She compares wire instructions against a printed
        reference sheet. She emails the lender if something looks off. The lender replies three hours
        later. Another loop starts.
      </p>
      <p
        style={{
          fontSize: "1.0625rem",
          lineHeight: 1.7,
          color: "var(--foreground)",
          opacity: 0.85,
          marginBottom: 16,
        }}
      >
        Wire fraud losses in residential real estate closings exceeded $350 million in 2024,
        according to the FBI IC3 report. The attack vector is almost always email compromise. The
        closing coordinator receives what looks like legitimate wire instructions from the title
        company. She forwards them to the buyer. The buyer wires $280,000 to an account controlled
        by an adversary. By the time anyone notices, the money is gone. The verification procedures
        that could have stopped this, calling the title company at a known number to confirm, reading
        back the account number digit by digit, checking the instruction timestamp against expected
        delivery windows, are manual steps performed under time pressure in a high-volume workflow.
        They fail.
      </p>
      <p
        style={{
          fontSize: "1.0625rem",
          lineHeight: 1.7,
          color: "var(--foreground)",
          opacity: 0.85,
          marginBottom: 16,
        }}
      >
        The technology stack beneath this coordination chaos has not changed since the late 1990s.
        Most title production systems are green-screen terminals dressed in a Windows wrapper. They
        speak mainframe protocols. They do not expose APIs. They do not integrate with modern tools.
        Coordinators still print PDFs to review them. They still fax documents to county recorders
        because the recorder's office has no other intake mechanism. The industry has added a few web
        portals for lender communication, but these are bolt-on systems that do not talk to the title
        production core. Every document still passes through email at some point. Every status update
        still requires a human to type it and send it.
      </p>

      <WorkflowDiagram />

      {/* Section 2: Why bolt-on AI fails */}
      <h2
        style={{
          fontSize: "clamp(1.5rem, 3vw, 2rem)",
          fontWeight: 300,
          letterSpacing: "-0.8px",
          color: "var(--foreground)",
          marginTop: 48,
          marginBottom: 16,
        }}
      >
        Why "AI Features" Bolted onto Legacy Software Fail
      </h2>
      <p
        style={{
          fontSize: "1.0625rem",
          lineHeight: 1.7,
          color: "var(--foreground)",
          opacity: 0.85,
          marginBottom: 16,
        }}
      >
        The title production software vendors have all announced AI features in the past 18 months.
        The feature set is remarkably consistent across vendors: a chatbot that answers questions
        about the file, a summarization tool that condenses the title commitment into bullet points,
        and an anomaly detector that flags unusual fee amounts. These features are built as isolated
        modules that sit on top of the legacy core. They read data from the production database via
        batch export. They present results in a separate UI panel. They do not write data back. They
        do not take actions. They do not integrate into the closing coordinator's actual workflow.
      </p>
      <p
        style={{
          fontSize: "1.0625rem",
          lineHeight: 1.7,
          color: "var(--foreground)",
          opacity: 0.85,
          marginBottom: 16,
        }}
      >
        The integration tax on these bolt-on features is high. The production system was not designed
        to be read by an AI. It stores data in COBOL flat files and proprietary binary formats. The
        export process is a nightly batch job that dumps tables to CSV. The chatbot ingests
        yesterday's data. If a coordinator updates a file at 10 AM, the chatbot will not see that
        update until the next morning. If the coordinator asks the chatbot to verify wire
        instructions, the chatbot cannot, because wire instructions live in a different system
        entirely, one that does not participate in the nightly export.
      </p>
      <p
        style={{
          fontSize: "1.0625rem",
          lineHeight: 1.7,
          color: "var(--foreground)",
          opacity: 0.85,
          marginBottom: 16,
        }}
      >
        More fundamentally, bolting intelligence onto a system that was built for data entry does not
        make the system intelligent. The architecture of a legacy title production system assumes
        that every action will be initiated by a human operator. The operator logs in, navigates to a
        file, opens a form, fills fields, saves, and logs out. The system records the state change.
        There is no concept of an agent that watches the file, detects a condition, and takes an
        action autonomously. There is no event stream. There is no workflow engine. There is no
        decision log. The system is a database with a UI wrapper, nothing more.
      </p>
      <p
        style={{
          fontSize: "1.0625rem",
          lineHeight: 1.7,
          color: "var(--foreground)",
          opacity: 0.85,
          marginBottom: 16,
        }}
      >
        The result is that AI features in legacy systems can advise but cannot act. They can
        summarize the title commitment, but they cannot update the CD with the correct figures. They
        can flag a suspicious wire instruction, but they cannot block the transaction or initiate a
        verification call. They can answer questions about the file, but they cannot proactively
        alert the coordinator when a compliance deadline is approaching. The coordinator still does
        the work. The AI feature is a research assistant, not a co-pilot. For workflows that are
        already bottlenecked on human attention, adding a research assistant does not solve the
        problem.
      </p>

      {/* Section 3: Agent-native architecture */}
      <h2
        style={{
          fontSize: "clamp(1.5rem, 3vw, 2rem)",
          fontWeight: 300,
          letterSpacing: "-0.8px",
          color: "var(--foreground)",
          marginTop: 48,
          marginBottom: 16,
        }}
      >
        What Agent-Native Architecture Looks Like
      </h2>
      <p
        style={{
          fontSize: "1.0625rem",
          lineHeight: 1.7,
          color: "var(--foreground)",
          opacity: 0.85,
          marginBottom: 16,
        }}
      >
        An agent-native system starts with a different assumption: that most closing work is pattern
        recognition and that patterns can be handled by software agents with no human in the loop.
        The human's role is to handle exceptions, make judgment calls when the pattern does not fit,
        and verify that the agent's work meets professional standards. The architecture is built
        around this division of labor from the ground up.
      </p>
      <p
        style={{
          fontSize: "1.0625rem",
          lineHeight: 1.7,
          color: "var(--foreground)",
          opacity: 0.85,
          marginBottom: 16,
        }}
      >
        The Model Context Protocol, released by Anthropic in late 2024, provides the interoperability
        layer. MCP defines a standard way for AI agents to discover and invoke tools, to read and
        write structured data, and to hand off control to other agents. A tool in MCP is a function
        with a typed signature. An agent can call a tool by providing the expected arguments. The
        tool executes, returns a typed result, and the agent decides what to do next. The protocol is
        transport-agnostic, the tools can live in separate processes or separate machines, and the
        agent does not need to know how the tool is implemented.
      </p>
      <p
        style={{
          fontSize: "1.0625rem",
          lineHeight: 1.7,
          color: "var(--foreground)",
          opacity: 0.85,
          marginBottom: 16,
        }}
      >
        TitleWise built titlewise-agent, an MCP server that exposes five document intelligence tools,
        for the External Track at the Agent Natives Builders Hackathon in August 2026. The tools are
        analyze_commitment, verify_wire, analyze_closing_disclosure, review_hoa, and recall. Each
        tool takes a document or a set of structured data as input and returns findings as structured
        output. The analyze_commitment tool takes a title commitment PDF, extracts the schedule B
        exceptions, identifies which are standard and which require action, and returns a JSON object
        listing each exception with a risk classification and a recommended next step. The verify_wire
        tool takes wire instructions, a file context, and a verification history, then runs an
        adversarial check where a second agent challenges the first agent's findings. If the two
        agents agree, the instructions are marked verified. If they disagree, the case is flagged for
        human review.
      </p>
      <p
        style={{
          fontSize: "1.0625rem",
          lineHeight: 1.7,
          color: "var(--foreground)",
          opacity: 0.85,
          marginBottom: 16,
        }}
      >
        The adversarial verification pipeline is the critical pattern. Wire fraud and compliance
        violations are high-stakes errors. A single false positive, approving fraudulent wire
        instructions or missing a TRID deadline, can cost hundreds of thousands of dollars and
        destroy a firm's reputation. An agent that runs alone, even a very good one, will eventually
        make a mistake. An adversarial pipeline where a second agent is tasked with finding fault in
        the first agent's work catches a much higher percentage of errors. The two agents have
        different prompts, different sampling temperatures, and different context windows. They are
        not redundant checks, they are independent analyses. When they agree, confidence is high. When
        they disagree, the case goes to a human.
      </p>
      <p
        style={{
          fontSize: "1.0625rem",
          lineHeight: 1.7,
          color: "var(--foreground)",
          opacity: 0.85,
          marginBottom: 16,
        }}
      >
        The production TitleWise platform has seven AI tools. Four of them analyze documents: title
        commitment analysis, closing disclosure review, HOA document review, and wire instruction
        verification. Two of them generate outputs: fee estimates and tax proration calculations. One
        of them coordinates: the status update tool, which watches the file state, compares it to the
        expected workflow timeline, and sends alerts to the coordinator, the lender, and the real
        estate agents when a milestone is reached or a deadline is approaching. For Pro and
        Enterprise tiers, there is an eighth tool, a closing agent that orchestrates the other seven.
        The closing agent is the system's decision-maker. It decides when to run each analysis, when
        to escalate a finding to a human, and when to proceed autonomously.
      </p>

      <ArchitectureDiagram />

      {/* Section 4: Case walkthrough */}
      <h2
        style={{
          fontSize: "clamp(1.5rem, 3vw, 2rem)",
          fontWeight: 300,
          letterSpacing: "-0.8px",
          color: "var(--foreground)",
          marginTop: 48,
          marginBottom: 16,
        }}
      >
        A Closing, Start to Finish
      </h2>
      <p
        style={{
          fontSize: "1.0625rem",
          lineHeight: 1.7,
          color: "var(--foreground)",
          opacity: 0.85,
          marginBottom: 16,
        }}
      >
        The file opens on Monday, June 2, 2026. The purchase price is $485,000. The buyer is
        financing $388,000. The lender is a regional credit union. The seller's agent uploads the
        contract to the TitleWise portal at 9:47 AM. The closing agent receives the contract,
        extracts the parties, the property address, the closing date (June 30), and the financing
        contingencies. It creates a file in the system, assigns a file number, and sends a
        confirmation email to the agents and the lender. The email includes a link to the file
        dashboard. All of this happens in 11 seconds.
      </p>
      <p
        style={{
          fontSize: "1.0625rem",
          lineHeight: 1.7,
          color: "var(--foreground)",
          opacity: 0.85,
          marginBottom: 16,
        }}
      >
        On Tuesday, the title searcher delivers the commitment. The closing agent receives the PDF,
        runs the analyze_commitment tool, and extracts 14 Schedule B exceptions. Twelve are standard
        form covenants and easements. One is a 2019 mechanic's lien for $8,400. One is a 2022
        judgment lien for $12,750. The agent flags both liens as actionable items, estimates payoff
        amounts with accrued interest, and adds them to the settlement statement draft. It sends an
        alert to the closing coordinator: "Two liens require payoff. Draft payoff demands sent to
        lienholders." The coordinator reviews the agent's work, approves the payoff letters, and the
        agent sends them. Elapsed time from commitment receipt to payoff demand transmission: 4
        minutes.
      </p>
      <p
        style={{
          fontSize: "1.0625rem",
          lineHeight: 1.7,
          color: "var(--foreground)",
          opacity: 0.85,
          marginBottom: 16,
        }}
      >
        On June 18, twelve days before the scheduled close, the lender uploads the initial Closing
        Disclosure. The closing agent runs the analyze_closing_disclosure tool, which is backed by a
        TRID compliance engine. The tool checks 47 line items against the purchase contract, the
        title commitment, the lender's fee worksheet, and the HOA statement. It identifies three
        discrepancies. The title insurance premium on the CD is $1,840. The commitment quotes $1,680.
        The HOA transfer fee on the CD is $250. The HOA statement shows $275. The lender's
        origination charge is $2,995, but the loan estimate from May 12 showed $2,750, and the
        variance exceeds the TRID tolerance threshold. The agent flags all three, calculates the
        required corrections, and sends a detailed report to the lender with the specific line
        numbers, the source documents, and the corrected figures. The lender revises the CD and
        re-uploads it within two hours. The agent re-analyzes, confirms the corrections, and sends
        the final CD to the parties. The three-day clock starts.
      </p>
      <p
        style={{
          fontSize: "1.0625rem",
          lineHeight: 1.7,
          color: "var(--foreground)",
          opacity: 0.85,
          marginBottom: 16,
        }}
      >
        On June 27, three days before the close, the buyer's lender sends wire instructions for the
        loan proceeds. The closing agent receives the instructions, runs the verify_wire tool with
        adversarial checking enabled, and returns a verification failure. The challenger agent flags
        a discrepancy: the wire instructions show a Wells Fargo routing number (121000248), but the
        lender's prior communications and the lender's website list a different routing number for
        incoming wires (121042882). The instruction also arrived outside the lender's normal business
        hours, at 7:18 PM. The agent escalates to the closing coordinator with a high-priority alert:
        "Wire instruction verification failed. Possible fraud. Do not proceed." The coordinator calls
        the lender's closing department at the known phone number the next morning. The lender
        confirms that the 7:18 PM email was not sent by them. It was a spoofed message. The real wire
        instructions arrive at 10:05 AM on June 28. The agent verifies them, both agents agree, and
        the instructions are cleared for funding.
      </p>
      <p
        style={{
          fontSize: "1.0625rem",
          lineHeight: 1.7,
          color: "var(--foreground)",
          opacity: 0.85,
          marginBottom: 16,
        }}
      >
        The closing occurs on June 30 as scheduled. The file required 22 human decisions over 28 days.
        The rest of the coordination, the document analysis, the compliance checks, the status
        updates, the payoff demands, the CD review, and the wire verification, was handled by
        software agents. The closing coordinator spent an average of 4.2 hours on this file. In a
        traditional workflow, the same file would have required 14 to 18 hours. The time savings
        compound across a portfolio. A solo practitioner handling 15 closings per month gains back
        two full weeks of time. A firm with three coordinators handling 60 closings per month gains
        back a full employee's worth of capacity.
      </p>

      <TimelineComparison />

      {/* Section 5: Where the industry goes */}
      <h2
        style={{
          fontSize: "clamp(1.5rem, 3vw, 2rem)",
          fontWeight: 300,
          letterSpacing: "-0.8px",
          color: "var(--foreground)",
          marginTop: 48,
          marginBottom: 16,
        }}
      >
        Where the Industry Goes from Here
      </h2>
      <p
        style={{
          fontSize: "1.0625rem",
          lineHeight: 1.7,
          color: "var(--foreground)",
          opacity: 0.85,
          marginBottom: 16,
        }}
      >
        The next phase is agent-to-agent communication between firms. A title company's closing agent
        will send a status update not to a human at the lender, but to the lender's own agent. The
        lender's agent will parse the update, check it against the lender's internal timeline, and if
        a discrepancy is found, initiate a clarification request back to the title agent. The two
        agents will resolve the discrepancy in seconds. The humans will see a log entry: "Timeline
        mismatch detected and resolved." Most closings will proceed with no human coordination at
        all.
      </p>
      <p
        style={{
          fontSize: "1.0625rem",
          lineHeight: 1.7,
          color: "var(--foreground)",
          opacity: 0.85,
          marginBottom: 16,
        }}
      >
        The MCP gateway is the interoperability layer that makes this possible. A title company
        exposes its document intelligence tools via MCP. A lender exposes its underwriting and
        funding tools via MCP. A real estate brokerage exposes its transaction management tools via
        MCP. Each firm's agent can discover and invoke the other firms' tools without custom
        integration work. The protocol handles authentication, authorization, rate limiting, and
        error handling. The firms remain independent. Their systems remain separate. But their agents
        can work together.
      </p>
      <p
        style={{
          fontSize: "1.0625rem",
          lineHeight: 1.7,
          color: "var(--foreground)",
          opacity: 0.85,
          marginBottom: 16,
        }}
      >
        The firms that adopt agent-native workflows first will have a compounding advantage. They
        will close files faster. They will catch errors that their competitors miss. They will handle
        higher volumes without adding headcount. Their coordinators will spend their time on the
        cases that require judgment, not on pattern work. The firms that delay will find themselves
        competing on cost against firms whose marginal cost per closing is approaching zero. The
        transition will be swift. The firms that wait for the legacy vendors to deliver will be too
        late.
      </p>

      {/* Section 6: About */}
      <h2
        style={{
          fontSize: "clamp(1.5rem, 3vw, 2rem)",
          fontWeight: 300,
          letterSpacing: "-0.8px",
          color: "var(--foreground)",
          marginTop: 48,
          marginBottom: 16,
        }}
      >
        About TitleWise
      </h2>
      <p
        style={{
          fontSize: "1.0625rem",
          lineHeight: 1.7,
          color: "var(--foreground)",
          opacity: 0.85,
          marginBottom: 16,
        }}
      >
        TitleWise is an AI-native document intelligence platform for title attorneys. Seven tools
        handle the pattern work of closings: title commitment analysis, closing disclosure review,
        wire verification, HOA review, fee estimates, tax proration, and automated status updates. A
        closing agent coordinates across all of them. TitleWise won the External Track at the Agent
        Natives Builders Hackathon in August 2026 with titlewise-agent, an MCP server that exposes
        document intelligence via the Model Context Protocol. The platform is built on Next.js 16,
        deployed on Vercel, and uses Claude 4 for document analysis. Firms on the Pro and Enterprise
        tiers get access to the full closing agent. Firms on the Starter tier get access to
        individual tools a la carte.
      </p>
      <p
        style={{
          fontSize: "1.0625rem",
          lineHeight: 1.7,
          color: "var(--foreground)",
          opacity: 0.85,
          marginBottom: 16,
        }}
      >
        The platform launched in private beta in July 2026 with six title firms in Florida and Texas.
        It is scheduled for general availability in Q1 2027. Interested firms can request early
        access at titlewise.app.
      </p>
    </article>
  );
}
