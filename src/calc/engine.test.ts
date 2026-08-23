/**
 * Edge cases and the decisions taken during planning that the PRD's golden
 * tables do not reach.
 */

import { describe, expect, it } from 'vitest'
import { calculate } from './index'
import { DEFAULT_COSTS, DEFAULT_INPUTS, MOVING_COSTS } from './constants'
import type { CostConstants, Inputs } from './types'

const TODAY = new Date('2026-08-23T00:00:00Z')
const at = (over: Partial<Inputs> = {}, costs: CostConstants = DEFAULT_COSTS) =>
  calculate({ ...DEFAULT_INPUTS, ...over }, costs, TODAY)

describe('timeline shape', () => {
  it('puts tasación and gestoría in their own rows BEFORE completion', () => {
    const rows = at().timeline
    const keys = rows.map((r) => r.key)
    expect(keys.indexOf('tasacion')).toBeLessThan(keys.indexOf('completion'))
    expect(keys.indexOf('gestoria')).toBeLessThan(keys.indexOf('completion'))
    expect(rows.find((r) => r.key === 'gestoria')?.stage).toBe('pre-completion')
  })

  it('starts with the arras and ends with the moving items', () => {
    const rows = at().timeline
    expect(rows[0]?.key).toBe('arras')
    expect(rows[0]?.delta.low).toBe(33_000)
    expect(rows.at(-1)?.stage).toBe('moving')
    expect(rows.filter((r) => r.stage === 'moving')).toHaveLength(MOVING_COSTS.length)
  })

  it('carries a running total that ends at allIn', () => {
    const r = at()
    expect(r.timeline.at(-1)?.running.low).toBe(r.allIn.low)
    expect(r.timeline.at(-1)?.running.high).toBe(r.allIn.high)
  })

  it('peakCash is the maximum of the running total, per bound independently', () => {
    const r = at()
    expect(r.peakCash.low).toBe(Math.max(...r.timeline.map((x) => x.running.low)))
    expect(r.peakCash.high).toBe(Math.max(...r.timeline.map((x) => x.running.high)))
  })

  it('splitting gestoría out leaves every golden figure unchanged', () => {
    // Guards the planning decision: the split is presentational, not numeric.
    const r = at({ price: 330_000 })
    expect(r.allIn.low).toBe(31_045)
    expect(r.allIn.high).toBe(39_440)
    expect(r.requirement.low).toBe(35_000)
    expect(r.requirement.high).toBe(39_440)
  })
})

describe('negative refund', () => {
  it('at 80% LTV the peak moves off the arras — the notary is the expensive moment', () => {
    const r = at({ price: 390_000, ltv: 0.8 })
    expect(r.refund).toBe(-39_000)

    const completion = r.timeline.find((x) => x.stage === 'completion')!
    const arrasRow = r.timeline.find((x) => x.stage === 'arras')!
    // A negative refund adds 39,000 of cash on the day, on top of taxes and fees.
    expect(completion.delta.low).toBeGreaterThan(arrasRow.delta.low)
    expect(completion.running.low).toBeGreaterThan(arrasRow.running.low * 2)

    // At 100% LTV the arras is the peak until moving starts; at 80% it never is.
    const easy = at({ price: 390_000, ltv: 1 })
    expect(easy.timeline[0]!.running.low).toBeGreaterThan(easy.timeline.find((x) => x.stage === 'completion')!.running.low)
    expect(arrasRow.running.low).toBeLessThan(completion.running.low)
  })
})

describe('independent lawyer', () => {
  it('moves requirement/allIn by a real floor when switched on', () => {
    const off = at({ price: 330_000, independentLawyer: false })
    const on = at({ price: 330_000, independentLawyer: true })
    // The PRD's 0–2,500 left the low bound untouched. 1,000 is a real minimum.
    expect(on.allIn.low - off.allIn.low).toBe(1_000)
    expect(on.allIn.high - off.allIn.high).toBe(2_500)
  })

  it('contributes nothing to transaction costs when off', () => {
    const off = at({ price: 330_000, independentLawyer: false })
    expect(off.transactionCosts.low).toBe(21_315)
    expect(off.transactionCosts.high).toBe(22_860)

    const on = at({ price: 330_000, independentLawyer: true })
    expect(on.transactionCosts.low - off.transactionCosts.low).toBe(1_000)
    expect(on.transactionCosts.high - off.transactionCosts.high).toBe(2_500)
  })
})

describe('AJD bands threshold-select a flat rate', () => {
  const ajdOn = (price: number) => {
    const nb = at({ price, propertyType: 'new-build' })
    const resale = at({ price, propertyType: 'resale' })
    // new-build tax = IVA + AJD; resale tax = ITP. Recover AJD from the delta.
    return nb.transactionCosts.low - resale.transactionCosts.low - (0.1 - 0.06) * price
  }

  it('0.4% below €120,000', () => expect(Math.round(ajdOn(100_000))).toBe(400))
  it('0.5% between €120,000 and €180,000', () => expect(Math.round(ajdOn(150_000))).toBe(750))
  it('0.75% above €180,000', () => expect(Math.round(ajdOn(250_000))).toBe(1_875))
  it('is not marginal — €390,000 pays 0.75% on the whole price', () =>
    expect(Math.round(ajdOn(390_000))).toBe(2_925))
})

describe('appraisal caps the loan', () => {
  it('an appraisal above the price does not inflate the loan', () => {
    // L = min(V, P) x ltv. V is only ever below P via the stress test, but the
    // cap must hold regardless.
    const r = at({ price: 330_000, ltv: 1 })
    expect(r.loan).toBe(330_000)
    expect(r.loan).toBeLessThanOrEqual(r.appraisal)
  })

  it('the stress test shrinks the loan and the refund together', () => {
    const normal = at({ price: 390_000 })
    const stressed = at({ price: 390_000, stressAppraisal: true })
    expect(stressed.loan).toBeLessThan(normal.loan)
    expect(stressed.refund).toBeLessThan(normal.refund)
    expect(stressed.requirement.low).toBeGreaterThan(normal.requirement.low)
  })
})

describe('savings countdown', () => {
  it('reaches the requirement in whole months from today', () => {
    const r = at({ price: 330_000, currentSavings: 12_000, patrickMonthly: 500 })
    // (35,000 − 12,000) / 500 = 46 exactly → 46 months from 2026-08
    expect(r.toRequirement.low.months).toBe(46)
    expect(r.toRequirement.low.reachable).toBe(true)
    expect(r.toRequirement.low.date?.getUTCFullYear()).toBe(2030)
    expect(r.toRequirement.low.date?.getUTCMonth()).toBe(5) // June
  })

  it('reports zero months when the target is already met', () => {
    const r = at({ price: 330_000, currentSavings: 100_000, patrickMonthly: 500 })
    expect(r.toRequirement.low.months).toBe(0)
    expect(r.toRequirement.high.months).toBe(0)
  })

  it('handles monthly <= 0 as "never at this rate", not a crash or a blank', () => {
    const r = at({ price: 330_000, currentSavings: 1_000, patrickMonthly: 0, jennyMonthly: 0 })
    expect(r.toRequirement.low.reachable).toBe(false)
    expect(r.toRequirement.low.months).toBe(Infinity)
    expect(r.toRequirement.low.date).toBeNull()
  })

  it('sums both saving rates into one monthly figure', () => {
    const solo = at({ price: 330_000, currentSavings: 0, patrickMonthly: 1_400 })
    const joint = at({ price: 330_000, currentSavings: 0, patrickMonthly: 800, jennyMonthly: 600 })
    expect(joint.toRequirement.low.months).toBe(solo.toRequirement.low.months)
  })
})

describe('date inversion', () => {
  it('flags that "everything including moving in" is reached BEFORE "enough to complete"', () => {
    // allIn.low 31,045 < requirement.low 35,000, so the second date lands first.
    const r = at({ price: 330_000, currentSavings: 0, patrickMonthly: 500 })
    expect(r.allIn.low).toBeLessThan(r.requirement.low)
    expect(r.toAllIn.low.months).toBeLessThan(r.toRequirement.low.months)
    expect(r.datesInverted).toBe(true)
  })

  it('is not flagged when nothing is inverted', () => {
    const r = at({ price: 330_000, currentSavings: 100_000, patrickMonthly: 500 })
    expect(r.datesInverted).toBe(false)
  })
})

describe('money is carried unrounded', () => {
  it('does not round inside the engine', () => {
    const r = at({ price: 333_333 })
    // 6% of 333,333 = 19,999.98 — a whole-euro result would betray rounding.
    expect(r.transactionCosts.low % 1).not.toBe(0)
  })

  it('computes low and high bounds independently', () => {
    const r = at({ price: 330_000 })
    expect(r.peakCash.low).not.toBe(r.peakCash.high)
    expect(r.allIn.low).not.toBe(r.allIn.high)
  })
})

describe('arras expressed in euros', () => {
  it('accepts a flat euro amount as well as a percentage', () => {
    const pct = at({ price: 330_000, arrasMode: 'percent', arrasValue: 10 })
    const eur = at({ price: 330_000, arrasMode: 'euros', arrasValue: 33_000 })
    expect(eur.arras).toBe(pct.arras)
    expect(eur.requirement.low).toBe(pct.requirement.low)
  })

  it('still applies the arras + float rule to a flat amount', () => {
    const r = at({ price: 330_000, arrasMode: 'euros', arrasValue: 40_000 })
    expect(r.requirement.low).toBe(42_000)
  })
})
