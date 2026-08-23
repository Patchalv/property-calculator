/**
 * EVERY figure in this app lives here, each with a source comment naming where
 * it came from. These are DEFAULTS, not fixed values — every cost line below is
 * editable in the UI at runtime.
 *
 * Rates here are `volatility: fast`. See AS_OF. An app that silently serves 2026
 * tax rates in 2029 is worse than no app.
 */

import type { CostConstants, CostLine, Inputs } from './types'

/** Rendered visibly in the UI as "Figures as of August 2026". */
export const AS_OF = '2026-08-23'
export const AS_OF_LABEL = 'August 2026'

// ---------------------------------------------------------------------------
// Tax rates
// ---------------------------------------------------------------------------

/**
 * ITP — transfer tax on RESALE property. Comunidad de Madrid: flat 6%.
 * Source: Buying a Resale Flat in Madrid — Costs and Taxes, verified against BOE
 * consolidated texts 2026-08-23. The strongest-sourced input in the model.
 */
export const ITP_RATE = 0.06

/** IVA — VAT on NEW-BUILD property, 10%. Paid instead of ITP, plus AJD below. */
export const IVA_RATE = 0.1

/**
 * AJD — stamp duty on new-build, on top of IVA.
 *
 * These bands THRESHOLD-SELECT a flat rate; they do not slice marginally. Madrid
 * AJD is a flat rate in law, and the PRD's golden test uses 0.75% x 390,000 =
 * 2,925 rather than any progressive sum. Only the top band matters at these
 * prices, but all three are implemented.
 */
export const AJD_BANDS: readonly { readonly upTo: number; readonly rate: number }[] = [
  { upTo: 120_000, rate: 0.004 },
  { upTo: 180_000, rate: 0.005 },
  { upTo: Infinity, rate: 0.0075 },
]

/**
 * The appraisal stress test values the flat at 90% of price.
 * Source: Tinsa appraisals run 14–15% under Idealista asking prices in
 * Carabanchel and Latina (Southwest Madrid Property Market). 0.9 is the gentler
 * end of that gap, taken deliberately.
 */
export const STRESS_APPRAISAL_FACTOR = 0.9

/**
 * Mi Primera Vivienda price cap, Orden 2350/2022 as amended, in force at
 * 2026-08-23. Used ONLY to decide which banner shows. The LTV control is never
 * gated on it — the Order can be superseded the day after publication in the
 * BOCM, and a hard gate would be wrong on that day.
 */
export const MPV_PRICE_CAP = 390_000

// ---------------------------------------------------------------------------
// Transaction costs
// ---------------------------------------------------------------------------

/**
 * Notary and registry use REALISTIC-INVOICE figures, not the statutory floor.
 * The computed arancel at 390,000 is 521 notary and 280 registry; real invoices
 * legitimately run higher, covering copias autorizadas y simples and folios.
 * Both numbers are recorded here deliberately — see NOTARY_ARANCEL below.
 */
export const NOTARY_ARANCEL_AT_390K = 521
export const REGISTRY_ARANCEL_AT_390K = 280

/**
 * Tax lines (ITP / IVA / AJD) are computed from price, not listed here.
 * Everything below is a flat range in euros.
 *
 * Ordering matters: `tasacion` and `gestoria` fall due BEFORE completion and are
 * pulled out into their own timeline rows. Everything else in this list is paid
 * at completion.
 */
export const TRANSACTION_COSTS: readonly CostLine[] = [
  // Bank's appraisal, ordered by the lender but paid by the buyer. Falls due
  // early, well before completion — hence its own timeline row.
  { key: 'tasacion', label: 'Tasación', low: 250, high: 600 },

  // The gestoría's provisión de fondos falls due DAYS BEFORE completion, which
  // is the entire reason the float exists. Its own timeline row for that reason.
  { key: 'gestoria', label: 'Gestoría (own)', low: 0, high: 450 },

  { key: 'notary', label: 'Notary — escritura de compraventa', low: 650, high: 950 },
  { key: 'registry', label: 'Registro de la Propiedad', low: 400, high: 600 },
  { key: 'notasSimples', label: 'Notas simples, extra copies', low: 15, high: 60 },
  { key: 'insurance', label: 'Home insurance, first year', low: 200, high: 400 },

  // PRD gives 0–2,500. Changed floor to 1,000: a lawyer you have actually
  // engaged does not cost zero, and with a zero floor `requirement.low` — the
  // figure the PRD demands be exact — was identical whether or not one was
  // hired. Off in every golden test, so no acceptance criterion is affected.
  { key: 'lawyer', label: 'Independent lawyer', low: 1_000, high: 2_500 },
]

/** Cost lines that fall due before completion, in the order they fall due. */
export const PRE_COMPLETION_KEYS = ['tasacion', 'gestoria'] as const

// ---------------------------------------------------------------------------
// Moving costs
// ---------------------------------------------------------------------------

/**
 * Source: Cash Required to Complete. Assumes part-furnished, light work only,
 * and one month of rent overlap. Totals 9,730 – 16,580.
 */
export const MOVING_COSTS: readonly CostLine[] = [
  { key: 'removals', label: 'Removals incl. montamuebles', low: 450, high: 1_050 },
  { key: 'utilities', label: 'Utility altas', low: 100, high: 200 },
  { key: 'appliances', label: 'Appliances and furniture gaps', low: 5_000, high: 8_000 },
  { key: 'decorating', label: 'Paint and floors', low: 3_000, high: 6_000 },
  { key: 'rentOverlap', label: 'One month rent overlap', low: 1_030, high: 1_030 },
  { key: 'misc', label: 'Locks, padrón, misc', low: 150, high: 300 },
]

export const DEFAULT_COSTS: CostConstants = {
  transaction: TRANSACTION_COSTS,
  moving: MOVING_COSTS,
}

// ---------------------------------------------------------------------------
// Input defaults
// ---------------------------------------------------------------------------

/**
 * Savings and both monthly rates ship at ZERO, deliberately.
 *
 * The PRD's own defaults are the household's real balance and real saving
 * rates. This repo is intended to be public so GitHub Pages is free; committing
 * those figures would publish the household's finances permanently into git
 * history, contradicting the PRD's own rule that nothing about the balance
 * should leave the browser. Type them in; they are never persisted.
 *
 * Do not restore the PRD's figures here, and do not quote them in a comment.
 */
export const DEFAULT_INPUTS: Inputs = {
  price: 330_000,
  propertyType: 'resale',
  ltv: 1,
  arrasMode: 'percent',
  arrasValue: 10,
  float: 2_000,
  currentSavings: 0,
  patrickMonthly: 0,
  jennyMonthly: 0,
  independentLawyer: false,
  stressAppraisal: false,
}
