import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { GLOSSARY } from './glossary'

/**
 * A tappable gloss. Not a hover tooltip — hover does not exist on the phone
 * layout, and the person these glosses are for will often be on a phone.
 *
 * The panel is portalled to <body> and positioned fixed. Several of these live
 * inside the timeline's horizontal scroll container, and a scroll container
 * clips on BOTH axes — an absolutely positioned panel on the last few rows was
 * cut off exactly where the plain-English explanation matters most.
 *
 * Rendered as a real button so it is reachable by keyboard and announced to a
 * screen reader, and dismissed on Escape or on a click elsewhere.
 */
export function Gloss({ id, children }: { id: keyof typeof GLOSSARY; children?: React.ReactNode }) {
  const entry = GLOSSARY[id]
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState({ top: 0, left: 0 })
  const trigger = useRef<HTMLButtonElement>(null)
  const panel = useRef<HTMLDivElement>(null)
  const panelId = useId()

  useLayoutEffect(() => {
    if (!open || !trigger.current) return

    const place = () => {
      const t = trigger.current?.getBoundingClientRect()
      if (!t) return
      const width = Math.min(304, window.innerWidth - 32)
      const height = panel.current?.offsetHeight ?? 220

      // Keep it on screen: flip above when there is no room below, and pull
      // back from the right edge rather than overflowing it.
      const below = t.bottom + 8
      const flipped = below + height > window.innerHeight - 8 && t.top > height + 16
      // Clamped to the viewport as a last resort: a panel the reader cannot see
      // is worse than one that has drifted from its trigger.
      const top = Math.max(8, flipped ? t.top - height - 8 : below)
      const left = Math.max(16, Math.min(t.left, window.innerWidth - width - 16))
      setPos({ top, left })
    }

    place()
    window.addEventListener('scroll', place, true)
    window.addEventListener('resize', place)
    return () => {
      window.removeEventListener('scroll', place, true)
      window.removeEventListener('resize', place)
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      const target = e.target as Node
      if (!trigger.current?.contains(target) && !panel.current?.contains(target)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false)
        trigger.current?.focus()
      }
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
    <>
      <button
        ref={trigger}
        type="button"
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        onClick={() => setOpen((v) => !v)}
        className="cursor-help border-b border-dashed border-gold pb-px text-left font-medium decoration-1 underline-offset-2 transition-colors hover:border-solid hover:bg-gold-soft"
      >
        {children ?? entry.term}
      </button>

      {open &&
        createPortal(
          <div
            ref={panel}
            id={panelId}
            role="note"
            style={{ top: pos.top, left: pos.left, width: 'min(19rem, calc(100vw - 2rem))' }}
            className="fixed z-50 border border-rule-firm bg-paper p-3.5 text-left shadow-[0_10px_28px_-14px_rgba(58,34,48,0.45)]"
          >
            <p className="eyebrow">{entry.term}</p>
            <p className="mt-1.5 text-[0.9375rem] leading-snug font-medium text-ink">
              {entry.short}
            </p>
            <p className="mt-2 text-[0.8125rem] leading-relaxed text-ink-soft">{entry.body}</p>
          </div>,
          document.body,
        )}
    </>
  )
}
