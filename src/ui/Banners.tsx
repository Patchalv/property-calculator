/**
 * The paperwork.
 *
 * These are the only cold-coloured things on the page, and the break is
 * deliberate — everything else is a warm notebook, and these are the Order, the
 * Law and the appraiser interrupting it.
 *
 * The copy is reproduced from the source documents and is NOT softened. Where a
 * Spanish term appears it is expanded inline rather than hidden behind a tap: a
 * warning that needs an interaction to parse is a warning that does not land.
 */

import { AS_OF_LABEL, MPV_PRICE_CAP } from '../calc/constants'
import { formatEuros } from '../format'

function StampHeading({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-1.5 text-[0.6875rem] font-semibold tracking-[0.16em] uppercase opacity-70">
      {children}
    </p>
  )
}

export function AppraisalBanner({
  stressed,
  onToggle,
}: {
  stressed: boolean
  onToggle: () => void
}) {
  return (
    <aside className="stamp p-4 sm:p-5">
      <StampHeading>Assumption · always in force</StampHeading>
      <p>
        Assumes the flat appraises at or above the purchase price. If it appraises low, the loan
        shrinks and the refund shrinks with it. Tinsa appraisals run 14–15% under Idealista asking
        prices in Carabanchel and Latina.
      </p>
      <button
        type="button"
        onClick={onToggle}
        aria-pressed={stressed}
        className={`mt-3.5 border px-3 py-2 text-[0.75rem] font-semibold tracking-[0.1em] uppercase transition-colors ${
          stressed
            ? 'border-gold bg-gold text-stamp'
            : 'border-stamp-ink/45 text-stamp-ink hover:border-gold hover:text-gold'
        }`}
      >
        {stressed ? 'Stress test on — show normal' : 'Stress test: appraise 10% low'}
      </button>
    </aside>
  )
}

export function SchemeBanner({ ltv, price }: { ltv: number; price: number }) {
  if (ltv !== 1) return null
  const overCap = price > MPV_PRICE_CAP

  return (
    <aside className="stamp p-4 sm:p-5">
      <StampHeading>Scheme validity · 100% lending</StampHeading>
      <p>
        100% financing in Madrid exists only through the Mi Primera Vivienda regional guarantee,
        which is capped at {formatEuros(MPV_PRICE_CAP)} under Orden 2350/2022 as amended, in force
        at 23 August 2026. The scheme permits 100% financing; it does not oblige any bank to grant
        it.
      </p>
      {overCap && (
        <p className="mt-3 border-t border-stamp-ink/25 pt-3">
          <span className="font-semibold text-gold">
            Above the {formatEuros(MPV_PRICE_CAP)} cap.
          </span>{' '}
          A 2026 draft Order reports €425,000 with financing tiered 100/95/90 by age band, but it is
          not law and its price cap has never been confirmed against a primary text.
        </p>
      )}
    </aside>
  )
}

const NOT_YOUR_COST = [
  ['Gestoría on the mortgage', 'the agency handling the mortgage paperwork'],
  ['Notary for the mortgage deed', 'not the purchase deed, which is yours'],
  ['Registry inscription of the mortgage', 'recording the loan at the land registry'],
  ['AJD on the mortgage', 'stamp duty on the loan itself'],
] as const

export function LeyBanner() {
  return (
    <aside className="stamp-quiet p-4 sm:p-5">
      <StampHeading>You should not be charged for these</StampHeading>
      <ul className="mt-2 space-y-1.5">
        {NOT_YOUR_COST.map(([item, plain]) => (
          <li key={item} className="grid grid-cols-[0.75rem_1fr] gap-1">
            <span aria-hidden className="text-gold">
              ×
            </span>
            <span>
              <span className="font-semibold">{item}</span>
              <span className="opacity-70"> — {plain}</span>
            </span>
          </li>
        ))}
      </ul>
      <p className="mt-3 border-t border-stamp/20 pt-3">
        All are the lender’s cost since Ley 5/2019. Banks routinely instruct a gestoría that then
        invoices the buyer for the whole bundle. Demand an itemised breakdown.
      </p>
    </aside>
  )
}

export function StalenessNote() {
  return (
    <p className="eyebrow border-t border-rule pt-4">
      Figures as of {AS_OF_LABEL} · rates move — re-check ITP, the cost ranges and the Mi Primera
      Vivienda caps before trusting this
    </p>
  )
}
