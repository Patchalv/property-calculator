/**
 * Types for the calculation engine.
 *
 * No React imports live anywhere under src/calc — the whole engine must be
 * testable without rendering anything.
 */

/**
 * Every money figure in this app is a range, never a point.
 *
 * Carried UNROUNDED through the entire calculation; rounding happens only at
 * render, in src/format.ts. `low` and `high` are computed independently end to
 * end — `peakCash` at the low bound is not derived from `peakCash` at the high
 * bound, it is a separate walk of a separate timeline.
 */
export interface Money {
  readonly low: number
  readonly high: number
}

export type PropertyType = 'resale' | 'new-build'

/** The four LTVs the PRD allows, as fractions. 100% exists only via Mi Primera Vivienda. */
export type Ltv = 1 | 0.95 | 0.9 | 0.8

/** Arras can be expressed either as a percentage of price or as a flat euro sum. */
export type ArrasMode = 'percent' | 'euros'

export interface Inputs {
  price: number
  propertyType: PropertyType
  ltv: Ltv
  arrasMode: ArrasMode
  /** Percent when arrasMode is 'percent' (10 means 10%), euros when 'euros'. */
  arrasValue: number
  /** Cash held back above the arras so the gestoría can be paid before the refund lands. */
  float: number
  currentSavings: number
  patrickMonthly: number
  jennyMonthly: number
  independentLawyer: boolean
  /**
   * Appraisal stress test. When true the engine values the flat at 90% of the
   * purchase price instead of assuming it appraises at or above it.
   */
  stressAppraisal: boolean
  /**
   * Apply the announced under-40 rates (ITP 4% up to €450,000, AJD 0.4% on new
   * build). Announced 5 October 2026, not yet law — see ITP_RATE_UNDER_40.
   */
  under40Rate: boolean
}

/** One editable cost line. Every figure here is a default, not a fixed value. */
export interface CostLine {
  readonly key: string
  readonly label: string
  readonly low: number
  readonly high: number
}

export interface CostConstants {
  transaction: readonly CostLine[]
  moving: readonly CostLine[]
}

export type TimelineStage = 'arras' | 'pre-completion' | 'completion' | 'moving'

export interface TimelineRow {
  readonly key: string
  readonly label: string
  readonly stage: TimelineStage
  /** Cash out of pocket, so positive means spent. */
  readonly delta: Money
  /** Running total after this row. Positive means cash gone. */
  readonly running: Money
}

/** `Infinity` months is rendered as "never at this rate", never as a crash or a blank. */
export interface Countdown {
  readonly months: number
  readonly reachable: boolean
  /** Null when unreachable. */
  readonly date: Date | null
}

export interface CountdownRange {
  /** Reaching the LOW bound of a target is the optimistic case, so it comes first. */
  readonly low: Countdown
  readonly high: Countdown
}

export interface Result {
  readonly arras: number
  readonly loan: number
  readonly appraisal: number
  readonly owedAtCompletion: number
  /** Negative means MORE cash due at the notary, not less. */
  readonly refund: number

  readonly timeline: readonly TimelineRow[]
  readonly transactionCosts: Money
  readonly movingCosts: Money

  readonly peakCash: Money
  readonly allIn: Money
  /** The headline. max(arras + float, peakCash, allIn), per bound. */
  readonly requirement: Money

  readonly toRequirement: CountdownRange
  readonly toAllIn: CountdownRange
  /**
   * True when "enough for everything including moving in" is reachable BEFORE
   * "enough to complete the purchase" — correct, but it reads as a bug, so the
   * UI prints an explanation when this is set.
   */
  readonly datesInverted: boolean
}
