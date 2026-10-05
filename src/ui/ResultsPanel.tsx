import type { ReactNode } from 'react'
import type { CostConstants, Inputs, Result } from '../calc/types'
import { formatCountdown, formatMonths, formatRange, formatSigned } from '../format'
import { AppraisalBanner, LeyBanner, SchemeBanner, StalenessNote, Under40Banner } from './Banners'
import { CostBreakdown } from './CostBreakdown'
import { Gloss } from './Gloss'
import { TimelineTable } from './TimelineTable'
import { Waterfall } from './Waterfall'

function Section({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string
  title?: string
  children: ReactNode
}) {
  return (
    <section className="border-t border-rule pt-7">
      <p className="eyebrow">{eyebrow}</p>
      {title && <h2 className="mt-1 mb-3 text-[1.375rem]">{title}</h2>}
      {children}
    </section>
  )
}

/**
 * Stress-test comparison. On desktop the two states sit side by side; on a
 * phone they stack as a labelled before/after pair. Same information either
 * way — the comparison must not quietly weaken on the smaller screen.
 */
function Compare({
  on,
  normal,
  stressed,
  children,
}: {
  on: boolean
  normal: Result
  stressed: Result
  children: (r: Result, variant: 'normal' | 'stressed') => ReactNode
}) {
  if (!on) return <>{children(normal, 'normal')}</>
  return (
    <div className="grid gap-6 lg:grid-cols-2 lg:gap-7">
      <div>
        <p className="eyebrow mb-2">As it stands</p>
        {children(normal, 'normal')}
      </div>
      <div className="border-t-2 border-stamp/25 pt-6 lg:border-t-0 lg:border-l-2 lg:pt-0 lg:pl-7">
        <p className="eyebrow mb-2 text-stamp">If it appraises 10% low</p>
        {children(stressed, 'stressed')}
      </div>
    </div>
  )
}

/**
 * The largest sentence on the page, so it is the one that must not assume a
 * refund. Above 90% LTV the deposit comes back; at 90% nothing does; below it
 * the loan falls short and the gap is due in cash on the day.
 */
function headlineCopy(refund: number): string {
  if (refund > 0) {
    return 'What you need saved to get through the purchase — the deposit has to be sitting there on the day even though it comes back to you later.'
  }
  if (refund === 0) {
    return 'What you need saved to get through the purchase. Nothing comes back at completion here: the loan covers exactly what is still owed and no more.'
  }
  return 'What you need saved to get through the purchase. Nothing comes back at completion — the loan falls short of what is owed, and the difference is due in cash on the day.'
}

function Headline({ r, variant }: { r: Result; variant: 'normal' | 'stressed' }) {
  return (
    <div>
      <p className="figure text-[clamp(2.1rem,7vw,3.25rem)] leading-[1.05] font-semibold text-balance">
        {formatRange(r.requirement)}
      </p>
      <p className="mt-2 max-w-lg text-[0.9375rem] leading-snug text-ink-soft">
        {variant === 'stressed'
          ? 'What you would need if the flat is valued below what you agreed to pay. The bank lends against its own valuation, so a shortfall lands on you in cash.'
          : headlineCopy(r.refund)}
      </p>
    </div>
  )
}

function DateRows({ r, inputs }: { r: Result; inputs: Inputs }) {
  const monthly = inputs.patrickMonthly + inputs.jennyMonthly

  const rows = [
    { label: 'Enough to complete the purchase', c: r.toRequirement, target: r.requirement },
    { label: 'Enough for everything, including moving in', c: r.toAllIn, target: r.allIn },
  ] as const

  return (
    <div className="space-y-3">
      {rows.map(({ label, c, target }) => (
        <div key={label} className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <div>
            <p className="text-[0.9375rem] leading-snug font-medium">{label}</p>
            <p className="figure text-[0.8125rem] text-ink-soft">{formatRange(target)}</p>
          </div>
          <p className="figure text-right text-[0.9375rem] font-semibold whitespace-nowrap">
            {formatCountdown(c.low)}
            {c.low.reachable && c.high.reachable && c.high.months !== c.low.months && (
              <span className="font-normal text-ink-soft"> – {formatCountdown(c.high)}</span>
            )}
            {c.low.reachable && c.low.months > 0 && (
              <span className="eyebrow ml-2">{formatMonths(c.low.months)}</span>
            )}
          </p>
        </div>
      ))}

      {monthly <= 0 && (
        <p className="text-[0.8125rem] leading-snug text-ink-soft">
          Nothing is going in each month. Put what the two of you save above and these become
          dates.
        </p>
      )}

      {r.datesInverted && (
        <p className="border-l-2 border-gold bg-gold-soft/60 py-2 pl-3 text-[0.8125rem] leading-snug">
          The second date comes first, and that is not a mistake: moving in costs less overall
          because your deposit comes back, but to complete you need that deposit sitting in the
          account on the day.
        </p>
      )}
    </div>
  )
}

/**
 * These two numbers only differ because the deposit comes back, and where the
 * peak actually falls changes what is true about it. At 100% LTV on a resale
 * the peak is the deposit; on a new-build, or once moving costs outrun it, the
 * peak lands after the keys; below 90% LTV it lands at the notary.
 *
 * Describing the wrong one would mislead in the single direction this page
 * exists to prevent, so the copy is chosen from the timeline, not assumed.
 */
function PeakVsNet({ r, stacked }: { r: Result; stacked: boolean }) {
  const converged = Math.round(r.peakCash.low) === Math.round(r.allIn.low)
  const peakStage = r.timeline.find((row) => row.running.low === r.peakCash.low)?.stage ?? 'arras'

  const peakCopy =
    peakStage === 'moving' ? (
      r.refund > 0 ? (
        <>
          This lands after the keys. The <Gloss id="refund">refund</Gloss> has arrived by then, but
          furnishing and work carry you past anything you were holding before.
        </>
      ) : (
        <>
          This lands after the keys, and nothing came back at completion to soften it — furnishing
          and work pile straight on top.
        </>
      )
    ) : peakStage === 'completion' ? (
      <>
        The notary is the expensive moment at this <Gloss id="ltv">LTV</Gloss> — the loan falls
        short of what is owed, and the gap is due in cash on the day.
      </>
    ) : (
      <>
        Roughly the <Gloss id="arras">arras</Gloss>, held for months before the refund lands.
      </>
    )

  const netCopy = converged ? (
    <>
      The same figure. The most you are ever holding out is also what the move ends up consuming,
      so there is no gap between the two answers here.
    </>
  ) : r.refund > 0 ? (
    <>
      Once the <Gloss id="refund">refund</Gloss> is counted. Lower, but you cannot spend money you
      have not been given back yet.
    </>
  ) : (
    <>
      No <Gloss id="refund">refund</Gloss> arrives, so nothing brings this back down.
    </>
  )

  return (
    <div className={`grid gap-4 ${stacked ? '' : 'sm:grid-cols-2'}`}>
      <div className="border border-rule bg-gold-soft/45 p-4">
        <p className="eyebrow">Most out of pocket at once</p>
        <p className="figure mt-1 text-2xl font-semibold">{formatRange(r.peakCash)}</p>
        <p className="mt-1.5 text-[0.8125rem] leading-snug text-ink-soft">{peakCopy}</p>
      </div>
      <div className="border border-rule bg-verde-soft/55 p-4">
        <p className="eyebrow">What the move actually consumes</p>
        <p className="figure mt-1 text-2xl font-semibold">{formatRange(r.allIn)}</p>
        <p className="mt-1.5 text-[0.8125rem] leading-snug text-ink-soft">{netCopy}</p>
      </div>
    </div>
  )
}

interface PanelProps {
  inputs: Inputs
  costs: CostConstants
  normal: Result
  stressed: Result
  onToggleStress: () => void
  onEditCost: (
    group: 'transaction' | 'moving',
    key: string,
    bound: 'low' | 'high',
    value: number,
  ) => void
  onResetCosts: () => void
  costsEdited: boolean
}

/**
 * The answer, and when you will have it.
 *
 * Split from the detail so a phone can show this before the form. Scrolling
 * past twenty inputs to reach the number defeats the point of the page.
 */
export function ResultsHeadline({ inputs, normal, stressed }: PanelProps) {
  const on = inputs.stressAppraisal

  return (
    <div className="space-y-7">
      <Section eyebrow="What you need">
        <Compare on={on} normal={normal} stressed={stressed}>
          {(r, variant) => (
            <>
              <Headline r={r} variant={variant} />
              {variant === 'stressed' && (
                <p className="figure mt-3 border-l-2 border-stamp pl-3 text-[0.8125rem] text-stamp">
                  Requirement {formatSigned(r.requirement.low - normal.requirement.low)} · refund{' '}
                  {formatSigned(r.refund - normal.refund)}
                </p>
              )}
            </>
          )}
        </Compare>
      </Section>

      <Section eyebrow="When you will have it">
        <Compare on={on} normal={normal} stressed={stressed}>
          {(r) => <DateRows r={r} inputs={inputs} />}
        </Compare>
      </Section>

    </div>
  )
}

export function ResultsDetail({
  inputs,
  costs,
  normal,
  stressed,
  onToggleStress,
  onEditCost,
  onResetCosts,
  costsEdited,
}: PanelProps) {
  const on = inputs.stressAppraisal

  return (
    <div className="space-y-7">
      <Section eyebrow="The two answers" title="Peak cash, and what it really costs">
        <Compare on={on} normal={normal} stressed={stressed}>
          {(r) => <PeakVsNet r={r} stacked={on} />}
        </Compare>
      </Section>

      <Section eyebrow="Where every euro goes" title="From signing to moved in">
        <Compare on={on} normal={normal} stressed={stressed}>
          {(r) => (
            <>
              <Waterfall
                rows={r.timeline}
                bound="low"
                float={inputs.float}
                peak={r.peakCash}
                refund={r.refund}
              />
              <TimelineTable result={r} />
            </>
          )}
        </Compare>
      </Section>

      <Section eyebrow="Argue with these" title="Every figure, and what it is a guess about">
        <CostBreakdown
          inputs={inputs}
          costs={costs}
          onEdit={onEditCost}
          onReset={onResetCosts}
          isEdited={costsEdited}
        />
        {on && (
          <p className="mt-4 text-[0.8125rem] text-ink-soft">
            These do not move under the stress test — a low valuation changes what the bank lends,
            not what the notary or the removals firm charges.
          </p>
        )}
      </Section>

      <Section eyebrow="Read this before you trust any of it">
        <div className="space-y-4">
          <AppraisalBanner stressed={on} onToggle={onToggleStress} />
          <SchemeBanner ltv={inputs.ltv} price={inputs.price} />
          <Under40Banner on={inputs.under40Rate} price={inputs.price} resale={inputs.propertyType === 'resale'} />
          <LeyBanner />
          <StalenessNote />
        </div>
      </Section>
    </div>
  )
}
