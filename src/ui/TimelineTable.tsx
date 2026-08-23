import type { Result, TimelineRow } from '../calc/types'
import { formatEuros, formatRange } from '../format'
import { Gloss } from './Gloss'

/** Spanish terms that appear as timeline row labels get their gloss attached. */
const GLOSS_FOR_ROW: Record<string, string> = {
  arras: 'arras',
  tasacion: 'tasacion',
  gestoria: 'provision',
  completion: 'completion',
  removals: 'montamuebles',
  misc: 'padron',
}

const STAGE_NOTE: Partial<Record<TimelineRow['stage'], string>> = {
  arras: 'Months before completion',
  'pre-completion': 'Falls due before completion',
  completion: 'On the day',
  moving: 'After the keys',
}

export function TimelineTable({ result }: { result: Result }) {
  let lastStage: TimelineRow['stage'] | null = null

  return (
    <div className="-mx-5 overflow-x-auto sm:mx-0">
      <table className="w-full min-w-[34rem] border-collapse text-left">
        <caption className="sr-only">
          Every movement of cash from signing the deposit to moving in, with a running total.
        </caption>
        <thead>
          <tr className="border-b border-rule-firm">
            <th scope="col" className="eyebrow px-5 py-2 sm:px-0">
              What happens
            </th>
            <th scope="col" className="eyebrow px-3 py-2 text-right">
              Amount
            </th>
            <th scope="col" className="eyebrow px-5 py-2 text-right sm:pr-0">
              Cash gone by now
            </th>
          </tr>
        </thead>
        <tbody>
          {result.timeline.map((row) => {
            const newStage = row.stage !== lastStage
            lastStage = row.stage
            const gloss = GLOSS_FOR_ROW[row.key]
            const refunding = row.delta.low < 0

            return (
              <tr
                key={row.key}
                className={`border-b border-rule/70 align-baseline ${
                  newStage ? 'border-t border-t-rule-firm' : ''
                } ${row.stage === 'moving' ? 'text-ink-soft' : ''}`}
              >
                <th scope="row" className="px-5 py-2.5 font-normal sm:pl-0">
                  <span className="block text-[0.9375rem] leading-snug font-medium text-ink">
                    {gloss ? <Gloss id={gloss as never}>{row.label}</Gloss> : row.label}
                  </span>
                  {newStage && STAGE_NOTE[row.stage] && (
                    <span className="eyebrow mt-0.5 block">{STAGE_NOTE[row.stage]}</span>
                  )}
                </th>
                <td
                  className={`figure px-3 py-2.5 text-right text-[0.875rem] whitespace-nowrap ${
                    refunding ? 'text-verde' : ''
                  }`}
                >
                  {formatRange(row.delta)}
                </td>
                <td className="figure px-5 py-2.5 text-right text-[0.875rem] font-semibold whitespace-nowrap sm:pr-0">
                  {formatRange(row.running)}
                </td>
              </tr>
            )
          })}
          <tr>
            <th scope="row" className="px-5 pt-3 text-left text-[0.9375rem] font-semibold sm:pl-0">
              What the whole move consumes
            </th>
            <td />
            <td className="figure px-5 pt-3 text-right text-[0.9375rem] font-semibold sm:pr-0">
              {formatRange(result.allIn)}
            </td>
          </tr>
        </tbody>
      </table>
      <p className="px-5 pt-3 text-[0.8125rem] text-ink-soft sm:px-0">
        The refund at completion is {formatEuros(result.refund)}
        {result.refund < 0
          ? ' — negative, so that much extra cash is due at the notary rather than coming back.'
          : result.refund === 0
            ? ' — the loan exactly covers what is still owed, so nothing comes back.'
            : ' — the bank sized the loan on the full price, so the difference returns to you.'}
      </p>
    </div>
  )
}
