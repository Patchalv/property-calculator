/**
 * Plain-English glosses. One of the two people using this page has never
 * encountered any of these terms, so every one of them is tappable everywhere
 * it appears.
 *
 * The headline and the three warning banners are the exception: they are
 * written in plain English with no gated terms, because a warning that needs a
 * tap to parse is a warning that does not land.
 */

export interface GlossEntry {
  term: string
  short: string
  body: string
}

export const GLOSSARY: Record<string, GlossEntry> = {
  arras: {
    term: 'Arras',
    short: 'The deposit you pay the seller when you agree the sale.',
    body: 'Paid to the seller months before completion, when you sign the deposit contract. It counts as an advance on the price, not an extra cost — so under a full mortgage it comes back to you on the day. The market norm is 10%, and the seller sets it, not you.',
  },
  completion: {
    term: 'Completion',
    short: 'The day you sign the deed at the notary and the flat is yours.',
    body: 'The mortgage is drawn down, the seller is paid, and the keys change hands. Everything before this is preparation; everything after is moving in.',
  },
  itp: {
    term: 'ITP',
    short: 'Transfer tax on a second-hand flat. In Madrid, 6% — or 4% for under-40s up to €450,000 if the announced 2027 cut becomes law.',
    body: 'Impuesto de Transmisiones Patrimoniales. Charged on resale property only, and usually the largest single line in the whole purchase. A new-build pays VAT and stamp duty instead, which costs meaningfully more.',
  },
  iva: {
    term: 'IVA + AJD',
    short: 'What a new-build pays instead of ITP: VAT at 10%, plus stamp duty.',
    body: 'IVA is Spanish VAT. AJD (Actos Jurídicos Documentados) is stamp duty on the deed, 0.75% in Madrid at these prices. Together they cost about €18,500 more than ITP on a €390,000 flat.',
  },
  tasacion: {
    term: 'Tasación',
    short: 'The bank’s valuation of the flat. You pay for it.',
    body: 'The lender orders it, to check the flat is worth what it is lending against — but the buyer is billed for it. It falls due early, well before completion.',
  },
  gestoria: {
    term: 'Gestoría',
    short: 'The admin agency that files your tax and registers the deed.',
    body: 'It asks for money up front — the provisión de fondos — and that bill lands days BEFORE completion, while your deposit is still with the seller. That timing is the entire reason you need a cash float.',
  },
  provision: {
    term: 'Provisión de fondos',
    short: 'Money the gestoría asks for up front, before completion.',
    body: 'It covers the tax and registry fees it is about to pay on your behalf. Because it falls due before your deposit comes back, you need spare cash sitting there to meet it.',
  },
  ltv: {
    term: 'LTV',
    short: 'How much of the flat’s price the bank lends you.',
    body: 'Loan to value. At 90% you find the other 10% yourself. 100% lending in Madrid exists only through a regional guarantee scheme — and the scheme permits it, it does not oblige any bank to grant it.',
  },
  float: {
    term: 'Float',
    short: 'Spare cash you hold back and do not touch.',
    body: 'It sits on top of the deposit so the gestoría can be paid before your deposit is refunded. €2,000 is the working figure. This is why the answer at €330,000 is €35,000 and not €33,000.',
  },
  refund: {
    term: 'Arras refund',
    short: 'Your deposit coming back at completion.',
    body: 'The bank sizes the loan on the full purchase price, not on what is left after your deposit. So at completion it pays the seller the balance and hands the difference back to you. Under a true 100% loan, that is your whole deposit returned.',
  },
  registro: {
    term: 'Registro de la Propiedad',
    short: 'The land registry, where your ownership is recorded.',
    body: 'Registering the deed is what makes your ownership enforceable against everyone else. Its fee is separate from the notary’s.',
  },
  notasimple: {
    term: 'Nota simple',
    short: 'A short official printout of who owns a property and what is charged on it.',
    body: 'Cheap, and worth pulling more than once — it shows any mortgage, embargo or dispute attached to the flat.',
  },
  escritura: {
    term: 'Escritura',
    short: 'The deed itself, signed in front of the notary.',
    body: 'Escritura de compraventa: the purchase deed. The notary’s fee for drawing and witnessing it is a buyer cost.',
  },
  padron: {
    term: 'Padrón',
    short: 'Registering yourself as living at the address, at the town hall.',
    body: 'Free, quick, and needed for a lot of ordinary admin afterwards.',
  },
  montamuebles: {
    term: 'Montamuebles',
    short: 'The furniture lift removals firms hoist through the window.',
    body: 'Standard in Madrid, where stairwells and lifts rarely take a sofa. It is a line on the removals quote, not an extra you can skip.',
  },
  mpv: {
    term: 'Mi Primera Vivienda',
    short: 'The Madrid scheme that makes 100% mortgages possible for first-time buyers.',
    body: 'The regional government guarantees part of the loan so a bank can lend the full price. It is capped by price, and the cap lives in an Order that can change at short notice.',
  },
  plusvalia: {
    term: 'Plusvalía municipal',
    short: 'A town-hall tax on the increase in land value, normally paid by the seller.',
    body: 'It shifts to the buyer if the seller is not resident in Spain. This calculator assumes a Spanish-resident seller and does not model it.',
  },
  ley5: {
    term: 'Ley 5/2019',
    short: 'The 2019 mortgage law that moved several costs onto the lender.',
    body: 'Since it came in, the bank pays for the mortgage deed, its registration, its stamp duty and the gestoría handling it. Banks still routinely instruct a gestoría that invoices the buyer for the lot.',
  },
}
