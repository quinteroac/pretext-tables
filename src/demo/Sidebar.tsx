
import { useMemo, useState, useCallback, useEffect } from 'react'
import { useScrollspy } from '../shared/hooks/useScrollspy.js'

export const DEMO_SECTIONS: { id: string; label: string }[] = [
  { id: 'useMeasure',             label: 'useMeasure' },
  { id: 'GridTableDemo',          label: 'GridTable' },
  { id: 'useExpandable',          label: 'useExpandable' },
  { id: 'useResizable',           label: 'useResizable' },
  { id: 'useResizePreview',       label: 'useResizePreview' },
  { id: 'useVirtualization',      label: 'useVirtualization' },
  { id: 'useColumnControls',      label: 'useColumnControls + useStickyColumns' },
  { id: 'useSearch',              label: 'useSearch' },
  { id: 'useSpanningCell',        label: 'useSpanningCell' },
  { id: 'useMediaCells',          label: 'useMediaCells' },
  { id: 'useDraggable',           label: 'useDraggable' },
  { id: 'useShrinkWrap',          label: 'useShrinkWrap' },
  { id: 'useScrollAnchor',        label: 'useScrollAnchor' },
  { id: 'useInfiniteScroll',      label: 'useInfiniteScroll' },
  { id: 'useDetachable',          label: 'useDetachable' },
  { id: 'useCanvasCell',          label: 'useCanvasCell' },
  { id: 'useEditable',            label: 'useEditable' },
  { id: 'useCellNotes',           label: 'useCellNotes' },
  { id: 'useDynamicFont',         label: 'useDynamicFont' },
  { id: 'useExportCanvas',        label: 'useExportCanvas' },
]

const SECTION_IDS = DEMO_SECTIONS.map(s => s.id)

export function Sidebar() {
  // ids array is stable (module-level constant) so useMemo is just for clarity
  const ids = useMemo(() => SECTION_IDS, [])
  const activeId = useScrollspy(ids)
  const [isOpen, setIsOpen] = useState(false)

  const open = useCallback(() => setIsOpen(true), [])
  const close = useCallback(() => setIsOpen(false), [])

  // Close panel on link click so navigation doesn't leave the panel open
  const handleLinkClick = useCallback(() => setIsOpen(false), [])

  // Close on Escape key when panel is open
  useEffect(() => {
    if (!isOpen) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') close() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [isOpen, close])

  return (
    <>
      {/* Hamburger — only visible below the 768 px breakpoint via CSS */}
      <button
        className="demo-hamburger"
        onClick={open}
        aria-label="Open navigation"
        aria-expanded={isOpen}
        aria-controls="demo-sidebar"
      >
        <span className="demo-hamburger__bar" />
        <span className="demo-hamburger__bar" />
        <span className="demo-hamburger__bar" />
      </button>

      {/* Backdrop — tapping outside closes the panel without navigating */}
      {isOpen && (
        <div
          className="demo-sidebar-backdrop"
          onClick={close}
          aria-hidden="true"
        />
      )}

      <nav
        id="demo-sidebar"
        className={`demo-sidebar${isOpen ? ' demo-sidebar--open' : ''}`}
        aria-label="Demo sections"
      >
        {/* Dedicated close button inside the panel */}
        <button
          className="demo-sidebar__close"
          onClick={close}
          aria-label="Close navigation"
        >
          ✕
        </button>
        <div className="demo-sidebar__inner">
          <p className="demo-sidebar__heading">sections</p>
          <ul className="demo-sidebar__list">
            {DEMO_SECTIONS.map(({ id, label }) => (
              <li key={id} className="demo-sidebar__item">
                <a
                  className={`demo-sidebar__link${activeId === id ? ' demo-sidebar__link--active' : ''}`}
                  href={`#${id}`}
                  aria-current={activeId === id ? 'location' : undefined}
                  onClick={handleLinkClick}
                >
                  {label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </nav>
    </>
  )
}
