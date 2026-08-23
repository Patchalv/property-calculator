/**
 * The signature element: the shape of the money.
 *
 * Cash climbs sharply when the arras is signed, sits there for months, then
 * collapses at completion when the bank hands the deposit back — and climbs
 * again while you move in. Hatched above the line, until the moment it is
 * released, is the float: cash that is present but not available.
 *
 * The float is drawn because it explains the headline, which is otherwise the
 * one number on the page with no visible cause.
 *
 * Hand-drawn rather than charted. The refund can go negative — at 80% LTV the
 * completion bar crosses the axis and keeps going — and no off-the-shelf
 * waterfall handles that without a custom renderer anyway.
 */

import type { Money, TimelineRow } from '../calc/types'
import { formatEuros } from '../format'

const W = 760
const H = 320
const PAD = { top: 30, right: 14, bottom: 70, left: 14 }

const STAGE_FILL: Record<TimelineRow['stage'], string> = {
  arras: 'var(--color-gold)',
  'pre-completion': 'var(--color-gold)',
  completion: 'var(--color-verde)',
  moving: '#9a8391',
}

/**
 * Completion is only good news when the refund is positive. Below 90% LTV it
 * is the single most expensive moment of the purchase, and coloring it as a
 * refund would mislead in exactly the direction this page exists to prevent.
 */
function completionLook(refund: number) {
  if (refund > 0) return { fill: 'var(--color-verde)', tone: 'var(--color-verde)', note: 'deposit comes back' }
  if (refund === 0) return { fill: '#9a8391', tone: 'var(--color-ink-soft)', note: 'nothing comes back' }
  return { fill: 'var(--color-gold)', tone: 'var(--color-gold)', note: 'extra cash due — no refund' }
}

const STAGE_LABEL: Record<TimelineRow['stage'], string> = {
  arras: 'Deposit',
  'pre-completion': 'Before completion',
  completion: 'Completion',
  moving: 'Moving in',
}

export function Waterfall({
  rows,
  bound,
  float,
  peak,
  refund,
}: {
  rows: readonly TimelineRow[]
  bound: 'low' | 'high'
  float: number
  peak: Money
  refund: number
}) {
  const completion = completionLook(refund)
  if (rows.length === 0) return null

  const running = rows.map((r) => r.running[bound])
  const ceiling = Math.max(...running, peak[bound] + float, 1) * 1.04
  const floor = Math.min(0, ...running) * 1.08

  const plotH = H - PAD.top - PAD.bottom
  const plotW = W - PAD.left - PAD.right
  const y = (v: number) => PAD.top + ((ceiling - v) / (ceiling - floor)) * plotH

  const slot = plotW / rows.length
  const barW = Math.max(7, slot * 0.5)
  const cx = (i: number) => PAD.left + i * slot + slot / 2

  // The float is held from the moment the deposit is signed until completion
  // releases it. After that it is just money again.
  const completionIdx = rows.findIndex((r) => r.stage === 'completion')
  const holdsFloat = (i: number) => float > 0 && (completionIdx < 0 || i < completionIdx)

  const zeroY = y(0)

  // Filled step area under the running total — this is the shape itself.
  const areaPath = [
    `M ${PAD.left} ${zeroY}`,
    ...rows.map((r, i) => {
      const v = y(r.running[bound])
      return `L ${PAD.left + i * slot} ${v} L ${PAD.left + (i + 1) * slot} ${v}`
    }),
    `L ${W - PAD.right} ${zeroY}`,
    'Z',
  ].join(' ')

  // Stage groups, for the labels along the bottom.
  const groups: { stage: TimelineRow['stage']; from: number; to: number }[] = []
  rows.forEach((r, i) => {
    const last = groups[groups.length - 1]
    if (last && last.stage === r.stage) last.to = i
    else groups.push({ stage: r.stage, from: i, to: i })
  })

  return (
    <figure className="mt-4">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="xMidYMid meet"
        role="img"
        aria-label={`Cash out of pocket from signing the deposit to moving in. Peak ${formatEuros(
          peak[bound],
        )}, ending at ${formatEuros(running[running.length - 1] ?? 0)}.`}
        className="h-auto w-full"
      >
        <defs>
          <pattern
            id="floatHatch"
            width="6"
            height="6"
            patternTransform="rotate(45)"
            patternUnits="userSpaceOnUse"
          >
            <rect width="6" height="6" fill="var(--color-gold-soft)" />
            <line x1="0" y1="0" x2="0" y2="6" stroke="var(--color-gold)" strokeWidth="2" opacity="0.7" />
          </pattern>
        </defs>

        <path d={areaPath} fill="var(--color-gold)" opacity="0.09" />

        {/* Connectors: the classic waterfall thread from each bar to the next. */}
        {rows.slice(0, -1).map((r, i) => (
          <line
            key={`c-${r.key}`}
            x1={cx(i) + barW / 2}
            x2={cx(i + 1) - barW / 2}
            y1={y(r.running[bound])}
            y2={y(r.running[bound])}
            stroke="var(--color-ink)"
            strokeWidth="1"
            strokeDasharray="2 2.5"
            opacity="0.45"
          />
        ))}

        {/* Float: held above the running total, released at completion. */}
        {rows.map((r, i) => {
          if (!holdsFloat(i)) return null
          const base = r.running[bound]
          return (
            <rect
              key={`f-${r.key}`}
              x={cx(i) - barW / 2}
              y={y(base + float)}
              width={barW}
              height={Math.max(2, y(base) - y(base + float))}
              fill="url(#floatHatch)"
              stroke="var(--color-gold)"
              strokeWidth="0.75"
              strokeOpacity="0.5"
            />
          )
        })}

        {rows.map((r, i) => {
          const before = i === 0 ? 0 : running[i - 1]!
          const after = running[i]!
          const top = Math.max(before, after)
          const bottom = Math.min(before, after)
          const falling = after < before
          return (
            <rect
              key={r.key}
              x={cx(i) - barW / 2}
              y={y(top)}
              width={barW}
              height={Math.max(2, y(bottom) - y(top))}
              fill={r.stage === 'completion' ? completion.fill : STAGE_FILL[r.stage]}
              opacity={falling ? 1 : 0.9}
            />
          )
        })}

        {/* Zero line last, so a negative excursion reads as crossing it. */}
        <line
          x1={PAD.left}
          x2={W - PAD.right}
          y1={zeroY}
          y2={zeroY}
          stroke="var(--color-ink)"
          strokeWidth="1.25"
          opacity="0.55"
        />

        {/* The most you are ever out of pocket. */}
        <line
          x1={PAD.left}
          x2={W - PAD.right}
          y1={y(peak[bound])}
          y2={y(peak[bound])}
          stroke="var(--color-ink)"
          strokeWidth="1"
          strokeDasharray="2 5"
          opacity="0.5"
        />
        <text
          x={W - PAD.right}
          y={y(peak[bound]) - 7}
          textAnchor="end"
          className="figure"
          fontSize="14"
          fontWeight="600"
          fill="var(--color-ink)"
        >
          most out of pocket · {formatEuros(peak[bound])}
        </text>

        {/* Stage brackets. The timeline is a real sequence, so this ordering
            carries information rather than decorating. */}
        {groups.map((g) => {
          const x1 = PAD.left + g.from * slot + 3
          const x2 = PAD.left + (g.to + 1) * slot - 3
          const yb = H - PAD.bottom + 14
          const isCompletion = g.stage === 'completion'
          return (
            <g key={`${g.stage}-${g.from}`}>
              <path
                d={`M ${x1} ${yb - 5} L ${x1} ${yb} L ${x2} ${yb} L ${x2} ${yb - 5}`}
                fill="none"
                stroke="var(--color-ink)"
                strokeWidth="1"
                opacity="0.3"
              />
              <text
                x={(x1 + x2) / 2}
                y={yb + 17}
                textAnchor="middle"
                fontSize="14"
                fontWeight={isCompletion ? 600 : 500}
                fill={isCompletion ? completion.tone : 'var(--color-ink-soft)'}
              >
                {STAGE_LABEL[g.stage]}
              </text>
              {isCompletion && (
                <text
                  x={(x1 + x2) / 2}
                  y={yb + 34}
                  textAnchor="middle"
                  fontSize="13"
                  fill={completion.tone}
                >
                  {completion.note}
                </text>
              )}
            </g>
          )
        })}
      </svg>

      <figcaption className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[0.75rem] text-ink-soft">
        <Key swatch="var(--color-gold)">Cash out</Key>
        {refund > 0 && <Key swatch="var(--color-verde)">Deposit refunded</Key>}
        <Key swatch="#9a8391">Moving in</Key>
        <Key hatched>Float — held, never spent</Key>
      </figcaption>
    </figure>
  )
}

function Key({
  swatch,
  hatched,
  children,
}: {
  swatch?: string
  hatched?: boolean
  children: React.ReactNode
}) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        aria-hidden
        className="inline-block size-2.5 border border-ink/15"
        style={
          hatched
            ? {
                backgroundColor: 'var(--color-gold-soft)',
                backgroundImage:
                  'repeating-linear-gradient(45deg, var(--color-gold) 0 1.5px, transparent 1.5px 4.5px)',
              }
            : { backgroundColor: swatch }
        }
      />
      {children}
    </span>
  )
}
