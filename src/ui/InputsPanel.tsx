import type { ArrasMode, CostConstants, Inputs, Ltv, PropertyType } from '../calc/types'
import { formatEuros } from '../format'
import { EuroInput, Field, Segmented, Toggle } from './controls'
import { Gloss } from './Gloss'

const PRICE_MIN = 150_000
const PRICE_MAX = 700_000

export function InputsPanel({
  inputs,
  set,
  costs,
  onEditCost,
}: {
  inputs: Inputs
  set: <K extends keyof Inputs>(key: K, value: Inputs[K]) => void
  costs: CostConstants
  onEditCost: (group: 'transaction' | 'moving', key: string, bound: 'low' | 'high', value: number) => void
}) {
  const monthly = inputs.patrickMonthly + inputs.jennyMonthly

  /** These two are points, not ranges — every change sets both bounds at once
      so `low === high` never drifts apart. */
  const setPointCost = (key: string) => (n: number) => {
    onEditCost('moving', key, 'low', n)
    onEditCost('moving', key, 'high', n)
  }
  const appliances = costs.moving.find((l) => l.key === 'appliances')
  const decorating = costs.moving.find((l) => l.key === 'decorating')

  /** Switching unit converts the figure so the arras itself does not jump. */
  const changeArrasMode = (mode: ArrasMode) => {
    if (mode === inputs.arrasMode) return
    if (mode === 'euros') {
      set('arrasValue', Math.round(inputs.price * (inputs.arrasValue / 100)))
    } else {
      set('arrasValue', inputs.price > 0 ? Math.round((inputs.arrasValue / inputs.price) * 1000) / 10 : 10)
    }
    set('arrasMode', mode)
  }

  return (
    <form
      className="space-y-7 border border-rule bg-sunk/70 p-5 sm:p-6"
      onSubmit={(e) => e.preventDefault()}
    >
      {/* Price is the main dial: slider to sweep, field to be exact. */}
      <Field
        label="Purchase price"
        htmlFor="price"
        hint={`Drag to explore, or type an exact figure. Range shown: ${formatEuros(PRICE_MIN)}–${formatEuros(PRICE_MAX)}.`}
      >
        <p className="figure -mt-0.5 mb-1 text-3xl font-semibold">{formatEuros(inputs.price)}</p>
        <input
          id="price"
          type="range"
          min={PRICE_MIN}
          max={PRICE_MAX}
          step={5_000}
          value={Math.min(PRICE_MAX, Math.max(PRICE_MIN, inputs.price))}
          onChange={(e) => set('price', Number(e.target.value))}
          aria-label="Purchase price"
          className="mb-2 w-full accent-[#d98a1f]"
        />
        <EuroInput label="Purchase price in euros" value={inputs.price} onChange={(n) => set('price', n)} step={1_000} />
      </Field>

      <Field label="Property type" hint="A new-build pays VAT and stamp duty instead of transfer tax, which costs meaningfully more.">
        <Segmented<PropertyType>
          label="Property type"
          value={inputs.propertyType}
          onChange={(v) => set('propertyType', v)}
          options={[
            { value: 'resale', label: 'Resale' },
            { value: 'new-build', label: 'New-build' },
          ]}
        />
      </Field>

      <Field
        label={<Gloss id="ltv">LTV — how much the bank lends</Gloss>}
        hint="Never locked, whatever the scheme cap says. The Order behind that cap can be replaced overnight."
      >
        <Segmented<Ltv>
          label="Loan to value"
          value={inputs.ltv}
          onChange={(v) => set('ltv', v)}
          options={[
            { value: 1, label: '100%' },
            { value: 0.95, label: '95%' },
            { value: 0.9, label: '90%' },
            { value: 0.8, label: '80%' },
          ]}
        />
      </Field>

      <Field
        label={<Gloss id="arras">Arras — deposit to the seller</Gloss>}
        hint="The seller sets this. 10% is the market norm."
      >
        <div className="flex gap-2">
          <div className="w-28 shrink-0">
            <Segmented<ArrasMode>
              label="Arras unit"
              value={inputs.arrasMode}
              onChange={changeArrasMode}
              options={[
                { value: 'percent', label: '%' },
                { value: 'euros', label: '€' },
              ]}
            />
          </div>
          <div className="flex-1">
            <EuroInput
              label={inputs.arrasMode === 'percent' ? 'Arras as a percentage' : 'Arras in euros'}
              value={inputs.arrasValue}
              onChange={(n) => set('arrasValue', n)}
              step={inputs.arrasMode === 'percent' ? 0.5 : 500}
              prefix={inputs.arrasMode === 'percent' ? '%' : '€'}
            />
          </div>
        </div>
      </Field>

      <Field
        label={<Gloss id="float">Float — cash held back</Gloss>}
        hint="Untouchable, so the gestoría can be paid before completion, whatever the deposit does."
      >
        <EuroInput label="Float held back, in euros" value={inputs.float} onChange={(n) => set('float', n)} step={500} />
      </Field>

      <div className="space-y-4 border-t border-rule pt-6">
        <p className="eyebrow">What you have, and what you add</p>

        <Field label="Current savings" hint="Combined. Nothing typed here is saved or sent anywhere.">
          <EuroInput label="Current savings, combined" value={inputs.currentSavings} onChange={(n) => set('currentSavings', n)} />
        </Field>

        {/*
          A real grid, not two stacked Fields side by side: "Patrick — monthly"
          wraps to two lines at this column width while "Jenny — monthly" fits
          on one, and two independent flex columns would let that push only
          Patrick's input down. Sharing grid rows keeps both inputs level
          regardless of which label wraps.
        */}
        <div className="grid grid-cols-2 gap-x-3 gap-y-1.5">
          <p className="eyebrow">Patrick — monthly</p>
          <p className="eyebrow">Jenny — monthly</p>
          <EuroInput label="Patrick, saved per month" value={inputs.patrickMonthly} onChange={(n) => set('patrickMonthly', n)} step={25} />
          <EuroInput label="Jenny, saved per month" value={inputs.jennyMonthly} onChange={(n) => set('jennyMonthly', n)} step={25} />
        </div>

        <p className="figure text-[0.8125rem] text-ink-soft">
          Saving {formatEuros(monthly)} a month between you.
        </p>
      </div>

      <div className="space-y-4 border-t border-rule pt-6">
        <p className="eyebrow">Moving-in costs you control</p>

        {appliances && (
          <Field label="Appliances and furniture gaps">
            <EuroInput
              label="Appliances and furniture gaps, in euros"
              value={appliances.low}
              onChange={setPointCost('appliances')}
              step={250}
            />
          </Field>
        )}

        {decorating && (
          <Field label="Paint and floors">
            <EuroInput
              label="Paint and floors, in euros"
              value={decorating.low}
              onChange={setPointCost('decorating')}
              step={250}
            />
          </Field>
        )}
      </div>

      <div className="border-t border-rule pt-6">
        <Toggle
          checked={inputs.independentLawyer}
          onChange={(v) => set('independentLawyer', v)}
          label="Hire an independent lawyer"
          hint="Adds €1,000–€2,500. Your own solicitor, separate from the seller’s and the bank’s."
        />
      </div>

      <div className="border-t border-rule pt-6">
        <Toggle
          checked={inputs.under40Rate}
          onChange={(v) => set('under40Rate', v)}
          label="Use the under-40 tax rate"
          hint="Transfer tax 4% instead of 6% up to €450,000, and lower stamp duty on new build. Announced 5 October 2026 for the 2027 budget. Not law yet."
        />
      </div>
    </form>
  )
}
