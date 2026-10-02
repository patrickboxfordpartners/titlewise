export interface Post {
  slug: string
  title: string
  description: string
  date: string
  author: string
  authorUrl: string
  category: string
  readTime: string
  body: string
  canonical?: string
}

export const posts: Post[] = [
  {
    slug: "electronic-recording-counties-what-closing-attorneys-need-to-know",
    title: "Counties Are Going Electronic. What Closing Attorneys Should Be Tracking.",
    description: "County recording offices are adopting e-recording at different speeds. If you close across multiple jurisdictions, the inconsistency is already affecting your workflow.",
    date: "September 8, 2026",
    author: "Patrick Mitchell",
    authorUrl: "https://linkedin.com/in/patricktmitchell",
    category: "Real Estate / Legal",
    readTime: "6 min read",
    canonical: "https://titlewise.app/blog/electronic-recording-counties-what-closing-attorneys-need-to-know",
    body: `<p>If you close across multiple counties, you've already noticed: recording isn't the same everywhere. Some counties are fully electronic. Some accept electronic submissions but still print and stamp on their end. Some still want you to walk documents in or mail originals.</p>

<p>A county that was paper-only last year might have rolled out e-recording this quarter. The county next door is still running the same process they've used since 1987. And the map keeps changing.</p>

<h2>Where E-Recording Stands in 2026</h2>

<p>E-recording lets you submit deeds, mortgages, releases, and assignments digitally instead of in person or by mail. The county reviews, indexes, and returns the recorded document electronically.</p>

<p>The technology has been around for twenty-plus years. MISMO published its first e-recording standards in the early 2000s. PRIA has been tracking adoption since before most attorneys were paying attention to it.</p>

<p>Roughly two-thirds of U.S. counties now accept electronic recordings in some form. But "some form" is doing a lot of work in that sentence.</p>

<p>Fully digital counties let you submit through Simplifile, ePN, or CSC. The county processes and indexes the document. You get a recorded copy back within hours, sometimes minutes. The original never exists on paper unless someone prints it.</p>

<p>Other counties accept your electronic submission but still run manual steps internally. A clerk prints it, stamps it, scans it back in, and returns the image. Electronic on your end. Paper on theirs.</p>

<p>Then there are the counties that haven't moved. Smaller jurisdictions, limited budgets, fifty recordings a day. The volume doesn't justify the cost, and what they have works.</p>

<h2>Why It's County by County</h2>

<p>County recording offices are locally funded, locally governed. No federal mandate. Some states have enabling legislation, but adoption decisions happen at the county level. Over 3,000 separate jurisdictions, each making their own call.</p>

<p>Implementation costs money. Compatible software, staff training, retention policy updates, security infrastructure, legal review of existing ordinances. A county processing fifty documents a day might look at that price tag and pass.</p>

<p>Security is a factor too. Electronic documents need tamper-evident seals, audit trails, and submitter identity verification. Counties that got burned on previous tech rollouts aren't rushing into this one.</p>

<p>COVID forced a lot of hands. Between 2020 and 2022, hundreds of counties that had been sitting on e-recording suddenly needed it. Offices that couldn't take walk-in filings had to find an alternative. Most of those emergency rollouts became permanent. But counties that made it through the pandemic on paper saw no reason to switch.</p>

<h2>The Impact on Multi-County Practices</h2>

<p>If you practice in one county, you know your recorder's process and you've built around it. This probably doesn't change much for you.</p>

<p>If you're closing across multiple counties, the inconsistency hits you every week.</p>

<p>An e-recording county returns a recorded deed in two hours. A paper county takes two weeks. If you're clearing title for a refi and the satisfaction is sitting in a paper recording queue, that's your problem now.</p>

<p>Document prep requirements are different too. Some e-recording platforms want specific margins, font sizes, barcode placements. Paper counties have their own rules. If you're preparing a deed that could end up filed in either type of county, you need both sets of specs.</p>

<p>E-recording platforms charge convenience fees on top of the county recording fee. The fees vary by platform and county. If you're quoting closing costs and you don't know whether that county went electronic since your last deal there, your estimate is wrong.</p>

<p>Post-closing tracking splits into two workflows. Some recordings come back in hours. Others take weeks. Different follow-up timelines, different escalation points.</p>

<h2>Counties to Watch</h2>

<p>The next wave is mid-size counties, 50,000 to 250,000 population. Enough volume to justify the investment, but they haven't felt the same pressure as metro areas.</p>

<p>Illinois, Texas, Florida, and Ohio have all moved legislation in 2025 and 2026 pushing county recorders toward electronic submissions. Some bills encourage it. Some require it within a set timeline.</p>

<p>If you're in one of those states, check your most-used counties quarterly. Simplifile and the other platforms maintain county availability maps that update as new jurisdictions come online.</p>

<h2>Staying Ahead of It</h2>

<p>This isn't about memorizing every county's current status. It's about having a system so you don't have to.</p>

<p>Before every closing, confirm the recording method for that county. Takes thirty seconds. Prevents the last-day scramble when you show up to a recorder's office that stopped taking walk-ins six months ago.</p>

<p>Build both paths into your checklist. E-recording counties: platform account, document formatting, submission workflow. Paper counties: courier or mailing logistics. Both paths ready means you're not figuring it out at the closing table.</p>

<p>Track pending recordings with the expected timeline for each county. Paper county normally returns in ten business days and you're at fifteen? Follow up. E-recording county normally returns in two hours and you haven't heard back in a day? Something's wrong.</p>

<p>Watch your state's legislative activity. If mandatory electronic recording is coming, the transition period is where most of the problems happen.</p>

<h2>Where TITLEwise Fits</h2>

<p>TITLEwise tracks recording requirements as part of its closing checklist. Create a matter and the system identifies the recording county, surfaces whether it accepts e-recording, which platform it uses, and what formatting rules apply.</p>

<p>Post-closing, the checklist tracks recording status alongside everything else that needs to happen after the table. Overdue based on that county's expected timeline? It flags it.</p>

<p>You're still the one who knows local practice. The system just makes sure the county-specific details don't fall through when you're running twenty-five files across eight jurisdictions.</p>`,
  },
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
    body: `<p>Closing attorneys are watching AI tools get pitched at them from every direction right now. Most are skeptical, and for good reason. They've seen software promise to simplify title work before.</p>

<p>But not all of what attorneys do in title review is the same kind of work.</p>

<h2>Pattern Work vs. Judgment Work</h2>

<p>Title examination takes time mostly because it involves checking the same fields on the same document types, looking for the same problems. Is the grantor name consistent with the prior deed? Does the legal description match? Are there open liens that should have been released? Is there a gap in the chain?</p>

<p>That work is pattern-based. It doesn't require legal training to execute, only legal training to define. Once you know what to look for and what counts as a problem, the actual checking is mechanical.</p>

<p>The attorney's value isn't in doing the mechanical checking. It's in knowing what to do when the mechanical check finds something, and in exercising judgment about risk, exceptions, and client advice.</p>

<p>That's the line. Pattern work is AI territory. Judgment work is attorney territory.</p>

<h2>What AI Can Handle</h2>

<p>Title commitments follow a standard structure. Schedule A has the property and transaction basics. Schedule B-I lists requirements. Schedule B-II lists exceptions. An AI system that understands these structures can scan a commitment and flag anything that looks off: missing requirements, exceptions that appear unusual, coverage gaps, inconsistencies between the insured amount and the purchase price.</p>

<p>Closing disclosures and HUD-1s are similar. The fields are defined. The relationships between fields are defined. Checking whether a disbursement line matches its referenced payoff statement, or whether a fee is disclosed correctly, is something AI can do faster and more consistently than a paralegal running down a checklist manually.</p>

<p>Deed review is the same. Does the legal description in the deed match the commitment? Is the grantor the same party that held title in the prior conveyance? Are signature and notarization blocks complete? Defined right answers. Missing one because of volume or fatigue is how errors happen in a busy practice.</p>

<p>Chain of title gaps are findable through document sequencing. If the title plant shows a conveyance from Smith to Jones in 2004, and the next recorded instrument has Jones conveying to Peterson in 2019, an AI system can flag that gap and surface it for review. It doesn't need to know why the gap exists. It just needs to know it does.</p>

<p>Lien and encumbrance cross-referencing works the same way. If a mortgage appears in Schedule B-I as a requirement for payoff but doesn't appear in the disbursement schedule, that's a discrepancy. Finding discrepancies is pattern work.</p>

<p>For most closings, attorneys and their staff spend four or more hours on this kind of checking. That's time a system could handle in seconds.</p>

<h2>What Still Requires the Attorney</h2>

<p>Finding a problem is different from knowing what to do about it.</p>

<p>An exception flagged in Schedule B-II might be standard survey language, or it might affect the property in a material way depending on what the client plans to do with it. An AI system can flag the exception. Deciding whether it matters for this client and this transaction is a legal judgment.</p>

<p>Easements and restrictions require interpretation. An access easement across the back of the property means something different if the client is building a garage than if they're leaving it as a vacation home. Reading the instrument, understanding scope, advising the client. Attorney work.</p>

<p>Title defects need legal analysis. If there's a break in the chain, someone has to evaluate whether it's curable, how to cure it, what the risk is if it isn't cured, and whether to insure over it or hold the closing. That's not a checklist item. It requires judgment about local title law, the underwriter's guidelines, and the specific facts of the transaction.</p>

<p>The certification is the attorney's act. When a closing attorney certifies title, they're signing off that they've examined the record and formed a professional opinion. AI can't make that certification and shouldn't. The attorney is the one with the license, the professional obligation, and the accountability.</p>

<p>Client advice is the same. What does this restriction mean for their plans? Should they accept this exception or negotiate it out? What's the risk of proceeding with this lien unresolved? Those conversations require a lawyer.</p>

<h2>The Practical Split</h2>

<p>Split the volume of work in a typical title examination between pattern work and judgment work. The pattern side is most of it by time. The judgment side is most of it by value.</p>

<p>Attorneys are spending the bulk of their hours on work that doesn't require their expertise. The work that actually needs them gets whatever time is left.</p>

<p>AI shifts that. Pattern checking happens in seconds. The items that require attorney judgment surface directly. No hours of mechanical review first.</p>

<p>For a practice running twenty or thirty closings a month, that changes the math on how title review works.</p>

<h2>How TITLEwise Fits</h2>

<p>TITLEwise handles the pattern work across seven document types: title commitments, closing disclosures, HUD-1s, deeds, title plants, lien searches, and surveys. It checks the fields, finds the inconsistencies, and flags what needs a closer look.</p>

<p>What comes out the other side is a set of exceptions, discrepancies, and items that need the attorney's judgment. The mechanical work is already done. The attorney focuses on what they were trained to do, which is the 10 to 15 percent of each file that actually requires them.</p>

<p>That doesn't replace closing attorneys. It removes the part of the job that consumes most of their time without requiring any of their expertise.</p>`,
  },
]

export function getPost(slug: string): Post | undefined {
  return posts.find((p) => p.slug === slug)
}

export function getAllPosts(): Post[] {
  return [...posts].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
}
