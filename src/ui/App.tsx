import { useMemo, useState } from 'react'
import { calculate } from '../calc'
import { DEFAULT_COSTS, DEFAULT_INPUTS } from '../calc/constants'
import type { CostConstants, Inputs } from '../calc/types'
import { InputsPanel } from './InputsPanel'
import { ResultsDetail, ResultsHeadline } from './ResultsPanel'

/**
 * Nothing here is persisted. A refresh puts the researched defaults back, by
 * choice — this page shows a household savings balance and no part of it is
 * stored, shared or sent anywhere.
 */
export function App() {
  const [inputs, setInputs] = useState<Inputs>(DEFAULT_INPUTS)
  const [costs, setCosts] = useState<CostConstants>(DEFAULT_COSTS)

  const set = <K extends keyof Inputs>(key: K, value: Inputs[K]) =>
    setInputs((prev) => ({ ...prev, [key]: value }))

  const editCost = (
    group: 'transaction' | 'moving',
    key: string,
    bound: 'low' | 'high',
    value: number,
  ) =>
    setCosts((prev) => ({
      ...prev,
      [group]: prev[group].map((l) => (l.key === key ? { ...l, [bound]: value } : l)),
    }))

  // Compared by value, not reference: editing a figure back to its default
  // should retire the reset control.
  const costsEdited = useMemo(
    () =>
      (['transaction', 'moving'] as const).some((group) =>
        costs[group].some((line, i) => {
          const original = DEFAULT_COSTS[group][i]
          return !original || line.low !== original.low || line.high !== original.high
        }),
      ),
    [costs],
  )

  // `today` is passed in rather than read inside the engine, so the engine stays
  // pure and every result is reproducible in a test.
  const today = useMemo(() => new Date(), [])

  const normal = useMemo(
    () => calculate({ ...inputs, stressAppraisal: false }, costs, today),
    [inputs, costs, today],
  )
  const stressed = useMemo(
    () => calculate({ ...inputs, stressAppraisal: true }, costs, today),
    [inputs, costs, today],
  )

  const panel = {
    inputs,
    costs,
    normal,
    stressed,
    onToggleStress: () => set('stressAppraisal', !inputs.stressAppraisal),
    onEditCost: editCost,
    onResetCosts: () => setCosts(DEFAULT_COSTS),
    costsEdited,
  }

  return (
    <div className="mx-auto max-w-6xl px-5 py-10 sm:px-8 sm:py-14">
      <header className="mb-9 max-w-2xl">
        <p className="eyebrow">Madrid · resale and new-build</p>
        <h1 className="mt-2 text-[clamp(2rem,6vw,3rem)]">How much cash do we need?</h1>
        <p className="mt-3 text-[1.0625rem] leading-relaxed text-ink-soft">
          Set a price and what you put away each month. This works out what has to be in the
          account, where every euro goes between signing and moving in, and when you will have it.
        </p>
      </header>

      {/*
        DOM order is answer, controls, detail — so a phone shows the number
        before the form, and the form before the deep breakdown. On desktop the
        grid puts the controls back in a left column beside all of it.
      */}
      <div className="grid gap-8 lg:grid-cols-[minmax(0,20rem)_minmax(0,1fr)] lg:grid-rows-[auto_1fr] lg:gap-x-12 lg:gap-y-7">
        <div className="lg:col-start-2 lg:row-start-1">
          <ResultsHeadline {...panel} />
        </div>
        <div className="lg:col-start-1 lg:row-span-2 lg:row-start-1">
          <InputsPanel inputs={inputs} set={set} />
        </div>
        <div className="lg:col-start-2 lg:row-start-2">
          <ResultsDetail {...panel} />
        </div>
      </div>
    </div>
  )
}
