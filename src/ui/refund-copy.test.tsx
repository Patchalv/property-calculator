/**
 * @vitest-environment jsdom
 */

/**
 * The refund's sign is the one thing this page must never get wrong.
 *
 * Above 90% LTV the deposit comes back at completion. At 90% nothing does. Below
 * it the loan falls short and the difference is due in cash on the day. Every
 * label, caption, colour and sentence has to track that — and a code review
 * caught the largest sentence on the page still asserting a refund at every LTV
 * after five other places had been fixed individually.
 *
 * So this tests the CLASS, not the instance: at every LTV where no refund
 * arrives, no rendered text may claim one.
 */

import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { calculate } from '../calc'
import { DEFAULT_COSTS, DEFAULT_INPUTS } from '../calc/constants'
import type { Inputs, Ltv } from '../calc/types'
import { ResultsDetail, ResultsHeadline } from './ResultsPanel'

afterEach(cleanup)

const TODAY = new Date('2026-08-23T00:00:00Z')

function renderAt(over: Partial<Inputs>) {
  const inputs: Inputs = { ...DEFAULT_INPUTS, price: 390_000, ...over }
  const normal = calculate({ ...inputs, stressAppraisal: false }, DEFAULT_COSTS, TODAY)
  const stressed = calculate({ ...inputs, stressAppraisal: true }, DEFAULT_COSTS, TODAY)
  const props = {
    inputs,
    costs: DEFAULT_COSTS,
    normal,
    stressed,
    onToggleStress: () => {},
    onEditCost: () => {},
    onResetCosts: () => {},
    costsEdited: false,
  }
  const { container } = render(
    <>
      <ResultsHeadline {...props} />
      <ResultsDetail {...props} />
    </>,
  )
  return { text: container.textContent ?? '', refund: normal.refund }
}

/** Phrases that assert money coming back. None may survive a zero or negative refund. */
const CLAIMS_A_REFUND = [
  /even though it comes back to you later/i,
  /before the refund lands/i,
  /once the refund is counted/i,
  /less the arras refund/i,
  /deposit comes back/i,
  /the refund has arrived/i,
  /deposit refunded/i,
]

describe('no rendered text claims a refund that does not arrive', () => {
  const noRefund: readonly Ltv[] = [0.9, 0.8]

  for (const ltv of noRefund) {
    it(`${ltv * 100}% LTV — refund is zero or negative, so nothing may say it comes back`, () => {
      const { text, refund } = renderAt({ ltv })
      expect(refund).toBeLessThanOrEqual(0)

      for (const claim of CLAIMS_A_REFUND) {
        expect(text, `"${claim.source}" must not appear when refund is ${refund}`).not.toMatch(claim)
      }
    })
  }

  it('100% LTV — the refund is real, so the page does say so', () => {
    const { text, refund } = renderAt({ ltv: 1 })
    expect(refund).toBeGreaterThan(0)
    expect(text).toMatch(/even though it comes back to you later/i)
    expect(text).toMatch(/less the arras refund/i)
  })

  it('95% LTV — a partial refund still counts as a refund', () => {
    const { text, refund } = renderAt({ ltv: 0.95 })
    expect(refund).toBeGreaterThan(0)
    expect(text).toMatch(/comes back/i)
  })

  it('the headline explains the shortfall instead, below 90%', () => {
    const { text } = renderAt({ ltv: 0.8 })
    expect(text).toMatch(/the loan falls short of what is owed/i)
  })
})

describe('the page survives inputs that should not be possible', () => {
  it('renders an unreachable target as "never at this rate" rather than crashing', () => {
    // A rate this slow put the completion date past the range JS Date can hold,
    // which threw out of Intl and blanked the whole page.
    const { text } = renderAt({ currentSavings: 0, patrickMonthly: 0.01, jennyMonthly: 0 })
    expect(text).toMatch(/never at this rate/i)
  })

  it('clamps an arras larger than the price instead of inverting the sale', () => {
    // A euro arras can outrun the price after the price is lowered. Unclamped,
    // owedAtCompletion went negative and the refund exceeded the loan.
    const inputs: Inputs = {
      ...DEFAULT_INPUTS,
      price: 200_000,
      arrasMode: 'euros',
      arrasValue: 300_000,
    }
    const r = calculate(inputs, DEFAULT_COSTS, TODAY)

    expect(r.arras).toBe(200_000)
    expect(r.owedAtCompletion).toBe(0)
    expect(r.refund).toBeLessThanOrEqual(r.loan)

    const { text } = renderAt({ price: 200_000, arrasMode: 'euros', arrasValue: 300_000 })
    expect(text).not.toMatch(/NaN|Infinity|undefined/)
    expect(screen.getAllByText(/Sign arras/i).length).toBeGreaterThan(0)
  })

  it('renders a zero price without NaN reaching the screen', () => {
    const { text } = renderAt({ price: 0 })
    expect(text).not.toMatch(/NaN|Infinity|undefined/)
  })
})
