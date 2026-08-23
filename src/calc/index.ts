/**
 * The calculation engine. Pure — no React imports anywhere under src/calc, and
 * `today` is passed in rather than read from the clock, so every result is
 * reproducible in a test.
 */

import { STRESS_APPRAISAL_FACTOR } from './constants'
import { countdownFor } from './countdown'
import { atLeast, exact, maxOf, sum } from './money'
import { activeTransactionLines, buildTimeline, core } from './timeline'
import { purchaseTax } from './tax'
import type { CostConstants, Inputs, Money, Result } from './types'

export function calculate(inputs: Inputs, costs: CostConstants, today: Date): Result {
  const c = core(inputs, STRESS_APPRAISAL_FACTOR)
  const timeline = buildTimeline(inputs, costs, c)

  const runningTotals = timeline.map((r) => r.running)
  const peakCash: Money = maxOf(runningTotals)
  const allIn: Money = runningTotals[runningTotals.length - 1] ?? exact(0)

  /**
   * The headline. The arras must be sitting in the account on the day even
   * though it comes back at completion, and the float must sit on top of it
   * untouched — so at lower prices the arras binds, not the cost of the
   * transaction. That is why €330,000 answers €35,000 and not €33,000.
   */
  const requirement = atLeast(maxOf([peakCash, allIn]), c.arras + inputs.float)

  const transactionCosts = sum([
    exact(purchaseTax(inputs.price, inputs.propertyType)),
    ...activeTransactionLines(costs, inputs.independentLawyer).map((l) => ({
      low: l.low,
      high: l.high,
    })),
  ])
  const movingCosts = sum(costs.moving.map((l) => ({ low: l.low, high: l.high })))

  const monthly = inputs.patrickMonthly + inputs.jennyMonthly
  const toRequirement = countdownFor(requirement, inputs.currentSavings, monthly, today)
  const toAllIn = countdownFor(allIn, inputs.currentSavings, monthly, today)

  /**
   * "Enough for everything including moving in" can land BEFORE "enough to
   * complete the purchase", because `requirement` holds the arras in cash while
   * `allIn` nets its refund out. Correct, but it reads as a bug — so the UI
   * explains it when this is set.
   */
  const datesInverted =
    toAllIn.low.reachable &&
    toRequirement.low.reachable &&
    toAllIn.low.months < toRequirement.low.months

  return {
    ...c,
    timeline,
    transactionCosts,
    movingCosts,
    peakCash,
    allIn,
    requirement,
    toRequirement,
    toAllIn,
    datesInverted,
  }
}

export * from './types'
