/**
 * The cash-flow timeline. Everything else in the engine is derived from its
 * running total, so this is built first.
 *
 * `delta` and `running` are cash OUT OF POCKET — positive means spent.
 */

import { PRE_COMPLETION_KEYS } from './constants'
import { add, exact, money, ZERO } from './money'
import { purchaseTax } from './tax'
import type { CostConstants, CostLine, Inputs, Money, TimelineRow } from './types'

export interface Core {
  arras: number
  appraisal: number
  loan: number
  owedAtCompletion: number
  refund: number
}

export function core(inputs: Inputs, stressFactor: number): Core {
  const { ltv, arrasMode, arrasValue, stressAppraisal } = inputs

  // Number inputs can hand us negatives and NaN, and a euro arras can outrun
  // the price after the price is lowered. Clamped here rather than at each
  // control, so no caller can construct an impossible state.
  const price = Math.max(0, Number.isFinite(inputs.price) ? inputs.price : 0)

  // The appraisal is ASSUMED equal to price unless the stress test is on. This
  // is the least safe assumption in the model, taken deliberately.
  const appraisal = stressAppraisal ? price * stressFactor : price

  const rawArras = arrasMode === 'percent' ? price * (arrasValue / 100) : arrasValue
  // An arras above the price is not a deposit, and would invert owedAtCompletion.
  const arras = Math.min(price, Math.max(0, Number.isFinite(rawArras) ? rawArras : 0))

  // The bank sizes the loan on the FULL purchase price, not on what is left
  // after the arras — which is the whole reason a refund exists.
  const loan = Math.min(appraisal, price) * ltv
  const owedAtCompletion = price - arras

  // Negative means MORE cash is due at the notary, not less.
  const refund = loan - owedAtCompletion

  return { arras, appraisal, loan, owedAtCompletion, refund }
}

/** Cost lines that apply, given the lawyer toggle. */
export function activeTransactionLines(
  costs: CostConstants,
  independentLawyer: boolean,
): readonly CostLine[] {
  return costs.transaction.filter((l) => l.key !== 'lawyer' || independentLawyer)
}

const asMoney = (l: CostLine): Money => money(l.low, l.high)

export function buildTimeline(
  inputs: Inputs,
  costs: CostConstants,
  c: Core,
): readonly TimelineRow[] {
  const lines = activeTransactionLines(costs, inputs.independentLawyer)
  const byKey = new Map(lines.map((l) => [l.key, l]))

  const rows: { key: string; label: string; stage: TimelineRow['stage']; delta: Money }[] = [
    { key: 'arras', label: 'Sign arras', stage: 'arras', delta: exact(c.arras) },
  ]

  // Tasación and the gestoría's provisión de fondos fall due BEFORE completion.
  // The gestoría row in particular is the entire reason the float exists, so it
  // gets its own line rather than disappearing into the completion lump.
  for (const key of PRE_COMPLETION_KEYS) {
    const line = byKey.get(key)
    if (line) rows.push({ key, label: line.label, stage: 'pre-completion', delta: asMoney(line) })
  }

  // Everything else in the transaction bundle lands on the day, net of the refund.
  const preCompletion = new Set<string>(PRE_COMPLETION_KEYS)
  const atCompletion = lines
    .filter((l) => !preCompletion.has(l.key))
    .reduce<Money>((acc, l) => add(acc, asMoney(l)), exact(purchaseTax(inputs.price, inputs.propertyType)))

  // The label has to track the refund's sign. Below 90% LTV nothing comes back
  // and there is a shortfall to find instead, so "less the arras refund" would
  // describe the opposite of what happens.
  const completionLabel =
    c.refund > 0
      ? 'Completion — taxes and fees, less the arras refund'
      : c.refund === 0
        ? 'Completion — taxes and fees, nothing refunded'
        : 'Completion — taxes and fees, plus the shortfall on the loan'

  rows.push({
    key: 'completion',
    label: completionLabel,
    stage: 'completion',
    delta: add(atCompletion, exact(-c.refund)),
  })

  for (const line of costs.moving) {
    rows.push({ key: line.key, label: line.label, stage: 'moving', delta: asMoney(line) })
  }

  let running: Money = ZERO
  return rows.map((r) => {
    running = add(running, r.delta)
    return { ...r, running }
  })
}
