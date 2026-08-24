/**
 * When the cash will exist, given current savings and the two saving rates.
 *
 * `monthly <= 0` yields "never at this rate" — Infinity months and a null date —
 * rather than a crash or a blank.
 */

import type { Countdown, CountdownRange, Money } from './types'

export function addMonths(from: Date, months: number): Date {
  const d = new Date(from.getTime())
  const targetDay = d.getUTCDate()
  d.setUTCDate(1)
  d.setUTCMonth(d.getUTCMonth() + months)
  // Clamp for short months: 31 Jan + 1 month is 28/29 Feb, not 2/3 Mar.
  const daysInMonth = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).getUTCDate()
  d.setUTCDate(Math.min(targetDay, daysInMonth))
  return d
}

/**
 * Beyond this, a date stops being information. It also keeps `addMonths` inside
 * the range JS Date can represent — past it, Intl throws on an invalid date and
 * takes the whole page down.
 */
const HORIZON_MONTHS = 1_200 // 100 years

export function monthsTo(target: number, currentSavings: number, monthly: number): Countdown {
  const shortfall = Math.max(0, target - currentSavings)
  if (shortfall === 0) return { months: 0, reachable: true, date: null }
  if (monthly <= 0) return { months: Infinity, reachable: false, date: null }

  const months = Math.ceil(shortfall / monthly)
  if (!Number.isFinite(months) || months > HORIZON_MONTHS) {
    return { months: Infinity, reachable: false, date: null }
  }
  return { months, reachable: true, date: null }
}

export function countdownFor(
  target: Money,
  currentSavings: number,
  monthly: number,
  today: Date,
): CountdownRange {
  const stamp = (c: Countdown): Countdown =>
    c.reachable ? { ...c, date: addMonths(today, c.months) } : c

  return {
    low: stamp(monthsTo(target.low, currentSavings, monthly)),
    high: stamp(monthsTo(target.high, currentSavings, monthly)),
  }
}
