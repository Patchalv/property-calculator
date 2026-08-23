import type { ReactNode } from 'react'

export function Field({
  label,
  hint,
  children,
  htmlFor,
}: {
  label: ReactNode
  hint?: ReactNode
  children: ReactNode
  htmlFor?: string
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={htmlFor} className="eyebrow block">
        {label}
      </label>
      {children}
      {hint && <p className="text-[0.8125rem] leading-snug text-ink-soft">{hint}</p>}
    </div>
  )
}

const inputBase =
  'figure w-full border border-rule-firm bg-paper px-3 py-2 text-[1.0625rem] text-ink placeholder:text-ink-soft/50 focus:border-ink focus:outline-none'

export function EuroInput({
  id,
  value,
  onChange,
  step = 100,
  prefix = '€',
  label,
}: {
  id?: string
  value: number
  onChange: (n: number) => void
  step?: number
  prefix?: string
  /** Accessible name. The visible label sits outside the input group, so a
      screen reader needs it stated here. */
  label: string
}) {
  return (
    <div className="flex items-stretch">
      <span className="figure flex items-center border border-r-0 border-rule-firm bg-sunk px-2.5 text-ink-soft">
        {prefix}
      </span>
      <input
        id={id}
        type="number"
        aria-label={label}
        inputMode="numeric"
        step={step}
        min={0}
        value={Number.isFinite(value) ? value : 0}
        onChange={(e) => onChange(e.target.value === '' ? 0 : Number(e.target.value))}
        className={inputBase}
      />
    </div>
  )
}

export function Segmented<T extends string | number>({
  options,
  value,
  onChange,
  label,
}: {
  options: readonly { value: T; label: string }[]
  value: T
  onChange: (v: T) => void
  label: string
}) {
  return (
    <div role="radiogroup" aria-label={label} className="flex border border-rule-firm">
      {options.map((o, i) => {
        const active = o.value === value
        return (
          <button
            key={String(o.value)}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(o.value)}
            className={`flex-1 px-2 py-2 text-[0.8125rem] font-semibold transition-colors ${
              i > 0 ? 'border-l border-rule-firm' : ''
            } ${active ? 'bg-ink text-paper' : 'bg-paper text-ink-soft hover:bg-sunk'}`}
          >
            {o.label}
          </button>
        )
      })}
    </div>
  )
}

export function Toggle({
  checked,
  onChange,
  label,
  hint,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  label: ReactNode
  hint?: ReactNode
}) {
  return (
    <label className="flex cursor-pointer items-start gap-2.5">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-1 size-4 shrink-0 accent-[#3a2230]"
      />
      <span>
        <span className="block text-[0.9375rem] font-medium">{label}</span>
        {hint && <span className="block text-[0.8125rem] leading-snug text-ink-soft">{hint}</span>}
      </span>
    </label>
  )
}
