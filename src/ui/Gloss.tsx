import { useEffect, useId, useRef, useState } from 'react'
import { GLOSSARY } from './glossary'

/**
 * A tappable gloss. Not a hover tooltip — hover does not exist on the phone
 * layout, and the person these glosses are for will often be on a phone.
 *
 * Rendered as a real button so it is reachable by keyboard and announced to a
 * screen reader, and dismissed on Escape or on a click elsewhere.
 */
export function Gloss({ id, children }: { id: keyof typeof GLOSSARY; children?: React.ReactNode }) {
  const entry = GLOSSARY[id]
  const [open, setOpen] = useState(false)
  const wrap = useRef<HTMLSpanElement>(null)
  const panelId = useId()

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (!wrap.current?.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  if (!entry) return <>{children}</>

  return (
    <span ref={wrap} className="relative inline-block">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        onClick={() => setOpen((v) => !v)}
        className="cursor-help border-b border-dashed border-gold pb-px text-left font-medium decoration-1 underline-offset-2 transition-colors hover:border-solid hover:bg-gold-soft"
      >
        {children ?? entry.term}
      </button>

      {open && (
        <span
          id={panelId}
          role="note"
          className="absolute top-full left-0 z-30 mt-2 block w-[min(19rem,calc(100vw-2.5rem))] border border-rule-firm bg-paper p-3.5 text-left shadow-[0_10px_28px_-14px_rgba(58,34,48,0.45)]"
        >
          <span className="eyebrow block">{entry.term}</span>
          <span className="mt-1.5 block text-[0.9375rem] leading-snug font-medium">
            {entry.short}
          </span>
          <span className="mt-2 block text-[0.8125rem] leading-relaxed text-ink-soft">
            {entry.body}
          </span>
        </span>
      )}
    </span>
  )
}
