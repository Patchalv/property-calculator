/**
 * Arithmetic over {low, high} pairs.
 *
 * The bounds are always operated on independently — there is no operation here
 * that lets the low bound influence the high one. Nothing rounds.
 */

import type { Money } from './types'

export const money = (low: number, high: number): Money => ({ low, high })
export const exact = (n: number): Money => ({ low: n, high: n })
export const ZERO: Money = { low: 0, high: 0 }

export const add = (a: Money, b: Money): Money => ({ low: a.low + b.low, high: a.high + b.high })
export const sub = (a: Money, b: Money): Money => ({ low: a.low - b.low, high: a.high - b.high })
export const scale = (a: Money, k: number): Money => ({ low: a.low * k, high: a.high * k })

export const sum = (xs: readonly Money[]): Money => xs.reduce(add, ZERO)

/** Widest spread of a set of pairs, per bound. */
export const maxOf = (xs: readonly Money[]): Money => ({
  low: Math.max(...xs.map((x) => x.low)),
  high: Math.max(...xs.map((x) => x.high)),
})

/** Raise both bounds to at least `floor`. Used for the arras + float rule. */
export const atLeast = (a: Money, floor: number): Money => ({
  low: Math.max(a.low, floor),
  high: Math.max(a.high, floor),
})
