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
    slug: "what-can-ai-automate-title-review",
    title: "What Parts of Title Review Can AI Actually Automate, and What Still Requires a Closing Attorney?",
    description: "The distinction between pattern work and judgment work in title examination, and why that line determines exactly where AI helps and where the attorney remains essential.",
    date: "July 22, 2026",
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
]

export function getPost(slug: string): Post | undefined {
  return posts.find((p) => p.slug === slug)
}

export function getAllPosts(): Post[] {
  return [...posts].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
}
