/**
 * Rendering. This is the ONLY place rounding happens — the engine carries money
 * unrounded end to end.
 *
 * English formatting throughout (€330,000), matching the notation the source
 * documents use and the language of every gloss on the page.
 */

import type { Countdown, Money } from './calc/types'

const euros = new Intl.NumberFormat('en-GB', {
  style: 'currency',
  currency: 'EUR',
  maximumFractionDigits: 0,
})

const monthYear = new Intl.DateTimeFormat('en-GB', {
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC',
})

/** Intl gives an ASCII hyphen; the page uses a real minus everywhere else. */
const trueMinus = (s: string): string => s.replace(/^-/, '\u2212')

export const formatEuros = (n: number): string => trueMinus(euros.format(Math.round(n)))

/** Signed, for deltas. A leading + matters when the number can go either way. */
export function formatSigned(n: number): string {
  const rounded = Math.round(n)
  if (rounded === 0) return formatEuros(0)
  return `${rounded > 0 ? '+' : '−'}${euros.format(Math.abs(rounded))}`
}

/** A range collapses to a single figure when both bounds round the same. */
export function formatRange(m: Money): string {
  const low = Math.round(m.low)
  const high = Math.round(m.high)
  if (low === high) return formatEuros(low)
  return `${formatEuros(low)} – ${formatEuros(high)}`
}

export const formatMonth = (d: Date): string => monthYear.format(d)

export function formatCountdown(c: Countdown): string {
  if (!c.reachable) return 'Never at this rate'
  if (c.months === 0) return 'Already saved'
  if (!c.date) return 'Already saved'
  return formatMonth(c.date)
}

export function formatMonths(months: number): string {
  if (!Number.isFinite(months)) return ''
  if (months === 0) return 'now'
  if (months === 1) return '1 month'
  if (months < 24) return `${months} months`
  const years = Math.floor(months / 12)
  const rest = months % 12
  return rest === 0 ? `${years} years` : `${years} yr ${rest} mo`
}
