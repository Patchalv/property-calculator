/**
 * THE ACCEPTANCE CRITERIA.
 *
 * These reproduce figures published in the source vault, so the engine is
 * verifiable rather than merely plausible. Nothing is rendered here — the
 * calculation module is exercised directly.
 */

import { describe, expect, it } from 'vitest'
import { calculate } from './index'
import { DEFAULT_COSTS, DEFAULT_INPUTS } from './constants'
import type { Inputs, Ltv, PropertyType } from './types'

/**
 * Fixed settings for the golden table: 100% LTV, 10% arras, €2,000 float,
 * lawyer off, resale, today's 6% ITP (`under40Rate` off — the under-40 cut is
 * announced, not law, and these figures predate it). `independentLawyer` is pinned explicitly rather than
 * inherited from `DEFAULT_INPUTS` — the UI's own default is a household
 * choice that can change independently of this fixture, and this table must
 * not drift with it.
 */
function goldenInputs(price: number, over: Partial<Inputs> = {}): Inputs {
  return { ...DEFAULT_INPUTS, price, independentLawyer: false, under40Rate: false, ...over }
}

const at = (price: number, over: Partial<Inputs> = {}) =>
  calculate(goldenInputs(price, over), DEFAULT_COSTS, new Date('2026-08-23T00:00:00Z'))

describe('golden: allIn and requirement', () => {
  it('€330,000 — allIn is 31,045 – 33,440', () => {
    const r = at(330_000)
    expect(Math.round(r.allIn.low)).toBe(31_045)
    expect(Math.round(r.allIn.high)).toBe(33_440)
  })

  // Both bounds are exact now, not just the low one: shrinking appliances
  // and decorating from ranges to points (see MOVING_COSTS in constants.ts)
  // removed what used to push the high bound above the arras+float floor, so
  // the floor now binds on both ends and the range collapses to one figure.
  it('€330,000 — requirement is exactly 35,000, both bounds', () => {
    const r = at(330_000)
    // arras + float, unambiguous arithmetic. Not a tolerance.
    expect(r.requirement.low).toBe(35_000)
    expect(Math.round(r.requirement.high)).toBe(35_000)
  })

  it('€390,000 — allIn is 34,645 – 37,040', () => {
    const r = at(390_000)
    expect(Math.round(r.allIn.low)).toBe(34_645)
    expect(Math.round(r.allIn.high)).toBe(37_040)
  })

  it('€390,000 — requirement is exactly 41,000, both bounds', () => {
    const r = at(390_000)
    expect(r.requirement.low).toBe(41_000)
    expect(Math.round(r.requirement.high)).toBe(41_000)
  })

  it('at the low bound the ARRAS binds, not the cost of the transaction', () => {
    // This is why €330,000 answers €35,000 and not €33,000.
    const r = at(330_000)
    expect(r.requirement.low).toBeGreaterThan(r.allIn.low)
    expect(r.requirement.low).toBeGreaterThan(r.peakCash.low)
    expect(r.requirement.low).toBe(r.arras + DEFAULT_INPUTS.float)
  })
})

describe('golden: refund collapse at €390,000, 10% arras', () => {
  const cases: readonly [Ltv, number, number][] = [
    [1, 390_000, 39_000],
    [0.95, 370_500, 19_500],
    [0.9, 351_000, 0],
    [0.8, 312_000, -39_000],
  ]

  for (const [ltv, loan, returned] of cases) {
    it(`${ltv * 100}% LTV — loan ${loan}, returned ${returned}`, () => {
      const r = at(390_000, { ltv })
      expect(r.loan).toBe(loan)
      expect(r.refund).toBe(returned)
    })
  }

  it('a negative refund means MORE cash due at the notary', () => {
    const r = at(390_000, { ltv: 0.8 })
    const completion = r.timeline.find((row) => row.stage === 'completion')
    expect(completion).toBeDefined()
    // −refund is +39,000 of extra cash on top of taxes and fees.
    expect(completion!.delta.low).toBeGreaterThan(39_000)
  })
})

describe('golden: appraisal stress test at €390,000, 100% LTV', () => {
  it('loan falls to 351,000, refund goes to zero, requirement jumps to 73,645 – 76,040', () => {
    const r = at(390_000, { stressAppraisal: true })
    expect(r.appraisal).toBe(351_000)
    expect(r.loan).toBe(351_000)
    expect(r.refund).toBe(0)
    expect(Math.round(r.requirement.low)).toBe(73_645)
    expect(Math.round(r.requirement.high)).toBe(76_040)
  })

  it('lands on the 73,700–82,000 figure estimated before the refund mechanic was understood', () => {
    const r = at(390_000, { stressAppraisal: true })
    expect(r.requirement.low).toBeGreaterThan(73_000)
    expect(r.requirement.high).toBeLessThan(83_000)
  })
})

describe('golden: new-build tax premium at €390,000', () => {
  it('IVA 39,000 + AJD 2,925 = 41,925, against ITP 23,400 — about €18,500 more', () => {
    const resale = at(390_000, { propertyType: 'resale' as PropertyType })
    const newBuild = at(390_000, { propertyType: 'new-build' as PropertyType })

    const delta = newBuild.transactionCosts.low - resale.transactionCosts.low
    expect(Math.round(delta)).toBe(18_525)
    expect(delta).toBeGreaterThan(18_000)
    expect(delta).toBeLessThan(19_000)
  })
})

describe('golden: transaction-cost totals against the published note', () => {
  /**
   * The note gives 24,965–26,460 at €390,000 and 21,315–22,800 at €330,000.
   * Those two do NOT decompose from an identical set of component ranges — they
   * disagree by €50 at the low end and €60 at the high end.
   *
   * TRUST THE COMPONENTS, NOT THE NOTE'S TOTALS. This is a rounding artefact in
   * a hand-written note, not a modelling error. Do not "fix" it.
   */
  const TOLERANCE = 150

  it('€330,000 is within €150 of the published 21,315 – 22,800', () => {
    const r = at(330_000)
    expect(Math.abs(r.transactionCosts.low - 21_315)).toBeLessThanOrEqual(TOLERANCE)
    expect(Math.abs(r.transactionCosts.high - 22_800)).toBeLessThanOrEqual(TOLERANCE)
  })

  it('€390,000 is within €150 of the published 24,965 – 26,460', () => {
    const r = at(390_000)
    expect(Math.abs(r.transactionCosts.low - 24_965)).toBeLessThanOrEqual(TOLERANCE)
    expect(Math.abs(r.transactionCosts.high - 26_460)).toBeLessThanOrEqual(TOLERANCE)
  })

  it('reproduces the note\'s discrepancy exactly, rather than hiding it', () => {
    // The components land on 21,315 exactly at €330,000 low and 26,460 exactly
    // at €390,000 high, and miss the other two ends by 60 and 50 respectively.
    expect(at(330_000).transactionCosts.low).toBe(21_315)
    expect(at(390_000).transactionCosts.high).toBe(26_460)
    expect(at(330_000).transactionCosts.high - 22_800).toBe(60)
    expect(24_965 - at(390_000).transactionCosts.low).toBe(50)
  })
})

describe('golden: moving costs', () => {
  it('totals 9,730 – 10,580', () => {
    const r = at(330_000)
    expect(r.movingCosts.low).toBe(9_730)
    expect(r.movingCosts.high).toBe(10_580)
  })
})
