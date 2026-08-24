import { useRef, type ReactNode } from 'react'

/**
 * Renders a real <label> only when it is given something to label. Several of
 * these captions contain a tappable gloss, and interactive content inside a
 * <label> is invalid HTML — the click target becomes ambiguous. Those cases get
 * a plain <p>; the inputs they sit above carry their own aria-label.
 */
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
  const Caption = htmlFor ? 'label' : 'p'
  return (
    <div className="space-y-1.5">
      <Caption {...(htmlFor ? { htmlFor } : {})} className="eyebrow block">
        {label}
      </Caption>
      {children}
      {hint && <p className="text-[0.8125rem] leading-snug text-ink-soft">{hint}</p>}
    </div>
  )
}

const inputBase =
  'figure h-11 w-full border border-rule-firm bg-paper px-3 text-[1.0625rem] text-ink placeholder:text-ink-soft/50 focus:border-ink focus:outline-none'

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

/**
 * A radio group is a single tab stop whose options are chosen with the arrow
 * keys — roving tabindex, not four separate stops. Announcing "radio button,
 * 2 of 4" and then ignoring the arrows the listener reaches for is worse than
 * having no roles at all.
 */
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
  const group = useRef<HTMLDivElement>(null)
  const selected = Math.max(
    0,
    options.findIndex((o) => o.value === value),
  )

  const move = (delta: number) => {
    const next = (selected + delta + options.length) % options.length
    const option = options[next]
    if (!option) return
    onChange(option.value)
    // Selection follows focus, so the newly chosen option takes the tab stop.
    const buttons = group.current?.querySelectorAll('button')
    buttons?.[next]?.focus()
  }

  const onKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowRight':
      case 'ArrowDown':
        e.preventDefault()
        move(1)
        break
      case 'ArrowLeft':
      case 'ArrowUp':
        e.preventDefault()
        move(-1)
        break
      case 'Home':
        e.preventDefault()
        move(-selected)
        break
      case 'End':
        e.preventDefault()
        move(options.length - 1 - selected)
        break
    }
  }

  return (
    <div
      ref={group}
      role="radiogroup"
      aria-label={label}
      onKeyDown={onKeyDown}
      className="flex h-11 border border-rule-firm"
    >
      {options.map((o, i) => {
        const active = i === selected
        return (
          <button
            key={String(o.value)}
            type="button"
            role="radio"
            aria-checked={active}
            tabIndex={active ? 0 : -1}
            onClick={() => onChange(o.value)}
            className={`flex flex-1 items-center justify-center px-2 text-[0.8125rem] font-semibold transition-colors ${
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
