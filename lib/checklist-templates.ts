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

export function getTemplateItems(transactionType: string): TemplateItem[] {
  const specific = {
    Purchase: PURCHASE_ITEMS,
    Sale: SALE_ITEMS,
    Refinance: REFINANCE_ITEMS,
    "Cash Purchase": CASH_ITEMS,
  }[transactionType] ?? []

  return [...COMMON_ITEMS, ...specific].sort((a, b) => a.sortOrder - b.sortOrder)
}
