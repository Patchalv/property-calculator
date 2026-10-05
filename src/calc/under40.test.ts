/**
 * The under-40 cut announced on 5 October 2026: ITP 4% on resale up to
 * €450,000, AJD 0.4% on new build. Announced, not law — see ITP_RATE_UNDER_40.
 */

import { describe, expect, it } from 'vitest'
import { calculate } from './index'
import { DEFAULT_COSTS, DEFAULT_INPUTS } from './constants'
import type { Inputs } from './types'

const TODAY = new Date('2026-10-05T00:00:00Z')
const at = (over: Partial<Inputs> = {}) =>
  calculate({ ...DEFAULT_INPUTS, independentLawyer: false, ltv: 1, ...over }, DEFAULT_COSTS, TODAY)

/** Transaction costs with the cut off, minus with it on. */
const saving = (over: Partial<Inputs>) =>
  at({ ...over, under40Rate: false }).transactionCosts.low -
  at({ ...over, under40Rate: true }).transactionCosts.low

describe('under-40 rate: resale ITP', () => {
  it('€380,000 — ITP 15,200 instead of 22,800, saving exactly 7,600', () => {
    expect(Math.round(saving({ price: 380_000 }))).toBe(7_600)
    // 1,515 is the fixed transaction-cost floor with the lawyer off.
    expect(Math.round(at({ price: 380_000, under40Rate: true }).transactionCosts.low)).toBe(15_200 + 1_515)
  })

  it('€450,000 is inside the cap — saving 9,000', () => {
    expect(Math.round(saving({ price: 450_000 }))).toBe(9_000)
  })

  it('€450,001 is over the cap — a cliff, the full 6% applies', () => {
    expect(saving({ price: 450_001 })).toBe(0)
  })
})

describe('under-40 rate: new-build AJD', () => {
  it('€390,000 — AJD 0.4% instead of 0.75%, saving 1,365', () => {
    expect(Math.round(saving({ price: 390_000, propertyType: 'new-build' }))).toBe(1_365)
  })

  it('€100,000 — already in the 0.4% band, nothing changes', () => {
    expect(saving({ price: 100_000, propertyType: 'new-build' })).toBe(0)
  })
})

describe('under-40 rate: what it does to the cash needed', () => {
  it('€380,000 clean case — requirement stays at arras + float, allIn falls by 7,600', () => {
    const off = at({ price: 380_000, under40Rate: false })
    const on = at({ price: 380_000, under40Rate: true })
    expect(on.requirement.low).toBe(on.arras + DEFAULT_INPUTS.float)
    expect(on.requirement.low).toBe(off.requirement.low)
    expect(Math.round(off.allIn.low - on.allIn.low)).toBe(7_600)
    expect(Math.round(off.allIn.high - on.allIn.high)).toBe(7_600)
  })

  it('€380,000 low appraisal — the saving reaches the requirement in full', () => {
    const off = at({ price: 380_000, stressAppraisal: true, under40Rate: false })
    const on = at({ price: 380_000, stressAppraisal: true, under40Rate: true })
    expect(Math.round(off.requirement.low - on.requirement.low)).toBe(7_600)
    expect(Math.round(off.requirement.high - on.requirement.high)).toBe(7_600)
  })
})
