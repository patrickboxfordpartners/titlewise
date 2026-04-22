type TemplateItem = {
  title: string
  assignedTo: string
  sortOrder: number
}

const COMMON_ITEMS: TemplateItem[] = [
  { title: "Signed purchase/sale agreement received", assignedTo: "attorney", sortOrder: 1 },
  { title: "Earnest money deposit confirmed", assignedTo: "buyer", sortOrder: 2 },
  { title: "Title search ordered", assignedTo: "attorney", sortOrder: 3 },
  { title: "Title commitment received and reviewed", assignedTo: "attorney", sortOrder: 4 },
  { title: "Title exceptions cleared", assignedTo: "attorney", sortOrder: 5 },
  { title: "Survey reviewed (if applicable)", assignedTo: "attorney", sortOrder: 6 },
  { title: "Property insurance binder received", assignedTo: "buyer", sortOrder: 7 },
  { title: "Tax proration calculated", assignedTo: "attorney", sortOrder: 8 },
  { title: "Closing date confirmed with all parties", assignedTo: "attorney", sortOrder: 9 },
  { title: "Settlement statement prepared and approved", assignedTo: "attorney", sortOrder: 10 },
  { title: "Wire instructions verified", assignedTo: "attorney", sortOrder: 11 },
  { title: "Closing documents prepared", assignedTo: "attorney", sortOrder: 12 },
  { title: "Closing conducted / signatures collected", assignedTo: "attorney", sortOrder: 13 },
  { title: "Funds disbursed", assignedTo: "attorney", sortOrder: 14 },
  { title: "Documents recorded", assignedTo: "attorney", sortOrder: 15 },
  { title: "Final title policy issued", assignedTo: "title_company", sortOrder: 16 },
]

const PURCHASE_ITEMS: TemplateItem[] = [
  { title: "Mortgage application submitted", assignedTo: "buyer", sortOrder: 20 },
  { title: "Appraisal ordered and completed", assignedTo: "lender", sortOrder: 21 },
  { title: "Home inspection completed", assignedTo: "buyer", sortOrder: 22 },
  { title: "Inspection contingency resolved", assignedTo: "buyer", sortOrder: 23 },
  { title: "Loan commitment received", assignedTo: "lender", sortOrder: 24 },
  { title: "Lender conditions satisfied", assignedTo: "buyer", sortOrder: 25 },
  { title: "Clear to close received from lender", assignedTo: "lender", sortOrder: 26 },
  { title: "Closing Disclosure reviewed and approved", assignedTo: "attorney", sortOrder: 27 },
  { title: "Final walkthrough completed", assignedTo: "buyer", sortOrder: 28 },
]

const SALE_ITEMS: TemplateItem[] = [
  { title: "Seller disclosure statement provided", assignedTo: "seller", sortOrder: 20 },
  { title: "Payoff statement obtained from existing lender", assignedTo: "attorney", sortOrder: 21 },
  { title: "HOA transfer documentation requested", assignedTo: "attorney", sortOrder: 22 },
  { title: "Existing liens/judgments cleared", assignedTo: "seller", sortOrder: 23 },
  { title: "Deed prepared for execution", assignedTo: "attorney", sortOrder: 24 },
]

const REFINANCE_ITEMS: TemplateItem[] = [
  { title: "Refinance application submitted", assignedTo: "buyer", sortOrder: 20 },
  { title: "Appraisal ordered and completed", assignedTo: "lender", sortOrder: 21 },
  { title: "Payoff statement from current lender", assignedTo: "attorney", sortOrder: 22 },
  { title: "Loan commitment received", assignedTo: "lender", sortOrder: 23 },
  { title: "Clear to close received", assignedTo: "lender", sortOrder: 24 },
  { title: "Closing Disclosure reviewed", assignedTo: "attorney", sortOrder: 25 },
  { title: "Existing mortgage discharged/recorded", assignedTo: "attorney", sortOrder: 26 },
]

const CASH_ITEMS: TemplateItem[] = [
  { title: "Proof of funds received", assignedTo: "buyer", sortOrder: 20 },
  { title: "Home inspection completed (if applicable)", assignedTo: "buyer", sortOrder: 21 },
  { title: "Final walkthrough completed", assignedTo: "buyer", sortOrder: 22 },
]

// State-specific checklist additions
const STATE_ITEMS: Record<string, TemplateItem[]> = {
  NH: [
    { title: "NH transfer tax calculated and paid (1.5% of consideration)", assignedTo: "attorney", sortOrder: 50 },
    { title: "NH real estate transfer tax stamps affixed to deed", assignedTo: "attorney", sortOrder: 51 },
    { title: "RETT form (CD-57) completed and filed with Registry of Deeds", assignedTo: "attorney", sortOrder: 52 },
    { title: "NH does not require attorney at closing — confirm title agent is licensed", assignedTo: "attorney", sortOrder: 53 },
  ],
  MA: [
    { title: "MA deed excise tax calculated ($4.56 per $1,000 of consideration)", assignedTo: "attorney", sortOrder: 50 },
    { title: "MA smoke/CO detector compliance certificate obtained", assignedTo: "seller", sortOrder: 51 },
    { title: "MA Title 5 septic inspection completed (if applicable)", assignedTo: "seller", sortOrder: 52 },
    { title: "MA attorney required at closing — confirm bar license", assignedTo: "attorney", sortOrder: 53 },
    { title: "6(d) certificate obtained from condo association (if applicable)", assignedTo: "attorney", sortOrder: 54 },
  ],
  NY: [
    { title: "NY mansion tax calculated (1% on purchases over $1M)", assignedTo: "attorney", sortOrder: 50 },
    { title: "NY transfer tax calculated (0.4% of purchase price)", assignedTo: "attorney", sortOrder: 51 },
    { title: "NYC RPT (Real Property Transfer Tax) if applicable", assignedTo: "attorney", sortOrder: 52 },
    { title: "ACRIS filing completed for NYC properties", assignedTo: "attorney", sortOrder: 53 },
    { title: "Co-op board approval obtained (if applicable)", assignedTo: "buyer", sortOrder: 54 },
  ],
  CA: [
    { title: "CA documentary transfer tax calculated ($1.10 per $1,000 of equity)", assignedTo: "attorney", sortOrder: 50 },
    { title: "Preliminary title report reviewed (not a title commitment)", assignedTo: "attorney", sortOrder: 51 },
    { title: "Natural hazard disclosure report obtained", assignedTo: "seller", sortOrder: 52 },
    { title: "FIRPTA withholding analyzed (if foreign seller)", assignedTo: "attorney", sortOrder: 53 },
    { title: "Proposition 19 reassessment analysis completed", assignedTo: "attorney", sortOrder: 54 },
  ],
  FL: [
    { title: "FL doc stamp tax on deed calculated ($0.70 per $100 consideration)", assignedTo: "attorney", sortOrder: 50 },
    { title: "FL intangible tax on mortgage calculated ($0.002 per $1)", assignedTo: "attorney", sortOrder: 51 },
    { title: "Homestead exemption application prepared (if primary residence)", assignedTo: "buyer", sortOrder: 52 },
    { title: "FL hurricane insurance binder reviewed", assignedTo: "buyer", sortOrder: 53 },
  ],
  TX: [
    { title: "TX title commitment Form T-7 reviewed", assignedTo: "attorney", sortOrder: 50 },
    { title: "TX survey exception evaluated (T-19 endorsement if needed)", assignedTo: "attorney", sortOrder: 51 },
    { title: "TX homestead designation reviewed for restrictions", assignedTo: "attorney", sortOrder: 52 },
    { title: "TX no state income tax — confirm no withholding required", assignedTo: "attorney", sortOrder: 53 },
  ],
  PA: [
    { title: "PA realty transfer tax calculated (1% state + local rate)", assignedTo: "attorney", sortOrder: 50 },
    { title: "PA Act 68 notice provided to buyer", assignedTo: "attorney", sortOrder: 51 },
    { title: "PA seller disclosure statement (RESDL) signed", assignedTo: "seller", sortOrder: 52 },
    { title: "Sewage facilities permit (if applicable)", assignedTo: "seller", sortOrder: 53 },
  ],
}

export function getTemplateItems(transactionType: string, state?: string | null): TemplateItem[] {
  const specific = {
    Purchase: PURCHASE_ITEMS,
    Sale: SALE_ITEMS,
    Refinance: REFINANCE_ITEMS,
    "Cash Purchase": CASH_ITEMS,
  }[transactionType] ?? []

  const stateItems = state ? (STATE_ITEMS[state.toUpperCase()] ?? []) : []

  return [...COMMON_ITEMS, ...specific, ...stateItems].sort((a, b) => a.sortOrder - b.sortOrder)
}

export const US_STATES = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA",
  "HI","ID","IL","IN","IA","KS","KY","LA","ME","MD",
  "MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ",
  "NM","NY","NC","ND","OH","OK","OR","PA","RI","SC",
  "SD","TN","TX","UT","VT","VA","WA","WV","WI","WY",
] as const
