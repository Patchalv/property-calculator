import { AJD_BANDS, ITP_RATE, IVA_RATE } from './constants'
import type { PropertyType } from './types'

/**
 * AJD is a FLAT rate selected by band, not a marginal slice. A €390,000
 * new-build pays 0.75% on the whole price, not 0.4% on the first €120,000 and
 * so on. See the note on AJD_BANDS.
 */
export function ajd(price: number): number {
  const band = AJD_BANDS.find((b) => price <= b.upTo) ?? AJD_BANDS[AJD_BANDS.length - 1]!
  return price * band.rate
}

/**
 * Purchase tax. Resale pays ITP; new-build pays IVA plus AJD instead, which at
 * €390,000 is about €18,500 more.
 */
export function purchaseTax(price: number, type: PropertyType): number {
  return type === 'resale' ? price * ITP_RATE : price * IVA_RATE + ajd(price)
}
