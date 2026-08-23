/**
 * Costs are edited HERE, where their effect is visible — not in a collapsed
 * panel on the other side of the page. The defaults are researched; the
 * discretionary ones are guesses and should be argued with.
 */

import { DEFAULT_COSTS } from '../calc/constants'
import { purchaseTax } from '../calc/tax'
import type { CostConstants, CostLine, Inputs } from '../calc/types'
import { formatEuros } from '../format'
import { Gloss } from './Gloss'

const GLOSS_FOR_LINE: Record<string, string> = {
  tasacion: 'tasacion',
  gestoria: 'gestoria',
  notary: 'escritura',
  registry: 'registro',
  notasSimples: 'notasimple',
  removals: 'montamuebles',
  misc: 'padron',
}

function Cell({
  value,
  onChange,
  label,
}: {
  value: number
  onChange: (n: number) => void
  label: string
}) {
  return (
    <input
      type="number"
      min={0}
      step={50}
      value={value}
      aria-label={label}
      onChange={(e) => onChange(e.target.value === '' ? 0 : Number(e.target.value))}
      className="figure w-20 border border-transparent bg-transparent px-1.5 py-1 text-right text-[0.875rem] hover:border-rule-firm hover:bg-paper focus:border-ink focus:bg-paper focus:outline-none"
    />
  )
}

function LineRows({
  lines,
  onEdit,
}: {
  lines: readonly CostLine[]
  onEdit: (key: string, bound: 'low' | 'high', value: number) => void
}) {
  return (
    <>
      {lines.map((l) => {
        const gloss = GLOSS_FOR_LINE[l.key]
        return (
          <tr key={l.key} className="border-b border-rule/60">
            <th scope="row" className="py-1.5 pr-3 text-left text-[0.875rem] font-normal">
              {gloss ? <Gloss id={gloss as never}>{l.label}</Gloss> : l.label}
            </th>
            <td className="py-1 text-right">
              <Cell value={l.low} label={`${l.label} low`} onChange={(n) => onEdit(l.key, 'low', n)} />
            </td>
            <td className="py-1 text-right">
              <Cell value={l.high} label={`${l.label} high`} onChange={(n) => onEdit(l.key, 'high', n)} />
            </td>
          </tr>
        )
      })}
    </>
  )
}

export function CostBreakdown({
  inputs,
  costs,
  onEdit,
  onReset,
  isEdited,
}: {
  inputs: Inputs
  costs: CostConstants
  onEdit: (group: 'transaction' | 'moving', key: string, bound: 'low' | 'high', value: number) => void
  onReset: () => void
  isEdited: boolean
}) {
  const tax = purchaseTax(inputs.price, inputs.propertyType)
  const shownTransaction = costs.transaction.filter(
    (l) => l.key !== 'lawyer' || inputs.independentLawyer,
  )

  return (
    <div className="space-y-6">
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b border-rule-firm">
            <th scope="col" className="eyebrow py-2 text-left">
              Buying it
            </th>
            <th scope="col" className="eyebrow py-2 text-right">
              Low
            </th>
            <th scope="col" className="eyebrow py-2 text-right">
              High
            </th>
          </tr>
        </thead>
        <tbody>
          <tr className="border-b border-rule/60">
            <th scope="row" className="py-1.5 pr-3 text-left text-[0.875rem] font-normal">
              {inputs.propertyType === 'resale' ? (
                <Gloss id="itp">ITP — transfer tax, 6%</Gloss>
              ) : (
                <Gloss id="iva">IVA 10% + AJD stamp duty</Gloss>
              )}
              <span className="ml-1.5 text-ink-soft">· from the price</span>
            </th>
            <td className="figure py-1.5 pr-1.5 text-right text-[0.875rem]">{formatEuros(tax)}</td>
            <td className="figure py-1.5 pr-1.5 text-right text-[0.875rem]">{formatEuros(tax)}</td>
          </tr>
          <LineRows
            lines={shownTransaction}
            onEdit={(k, b, v) => onEdit('transaction', k, b, v)}
          />
        </tbody>
      </table>

      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b border-rule-firm">
            <th scope="col" className="eyebrow py-2 text-left">
              Moving in
            </th>
            <th scope="col" className="eyebrow py-2 text-right">
              Low
            </th>
            <th scope="col" className="eyebrow py-2 text-right">
              High
            </th>
          </tr>
        </thead>
        <tbody>
          <LineRows lines={costs.moving} onEdit={(k, b, v) => onEdit('moving', k, b, v)} />
        </tbody>
      </table>

      <div className="flex items-baseline justify-between gap-4">
        <p className="text-[0.8125rem] text-ink-soft">
          Every figure here is editable. Nothing is saved — a refresh puts the researched defaults
          back.
        </p>
        {isEdited && (
          <button
            type="button"
            onClick={onReset}
            className="eyebrow shrink-0 border-b border-gold pb-0.5 text-ink hover:border-ink"
          >
            Reset costs
          </button>
        )}
      </div>
    </div>
  )
}

export const PRISTINE_COSTS = DEFAULT_COSTS
