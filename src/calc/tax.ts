import {
  AJD_BANDS,
  AJD_RATE_UNDER_40,
  ITP_RATE,
  ITP_RATE_UNDER_40,
  IVA_RATE,
  UNDER_40_ITP_PRICE_CAP,
} from './constants'
import type { PropertyType } from './types'

/**
 * AJD is a FLAT rate selected by band, not a marginal slice. A €390,000
 * new-build pays 0.75% on the whole price, not 0.4% on the first €120,000 and
 * so on. See the note on AJD_BANDS.
 *
 * The under-40 rate never raises the band rate — at or below €120,000 the band
 * is already 0.4%.
 */
export function ajdRate(price: number, under40: boolean): number {
  const band = AJD_BANDS.find((b) => price <= b.upTo) ?? AJD_BANDS[AJD_BANDS.length - 1]!
  return under40 ? Math.min(band.rate, AJD_RATE_UNDER_40) : band.rate
}

export function ajd(price: number, under40 = false): number {
  return price * ajdRate(price, under40)
}

/** The under-40 cap is a cliff: one euro over €450,000 and the full 6% applies. */
export function itpRate(price: number, under40: boolean): number {
  return under40 && price <= UNDER_40_ITP_PRICE_CAP ? ITP_RATE_UNDER_40 : ITP_RATE
}

/**
 * Purchase tax. Resale pays ITP; new-build pays IVA plus AJD instead, which at
 * €390,000 is about €18,500 more.
 */
export function purchaseTax(price: number, type: PropertyType, under40 = false): number {
  return type === 'resale' ? price * itpRate(price, under40) : price * IVA_RATE + ajd(price, under40)
}
