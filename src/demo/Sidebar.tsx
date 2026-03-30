
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
          <div className="demo-sidebar__footer">
            <a
              className="demo-sidebar__github"
              href="https://github.com/quinteroac/pretext-tables"
              target="_blank"
              rel="noopener noreferrer"
            >
              <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
                <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38
                  0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13
                  -.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66
                  .07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15
                  -.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0
                  1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82
                  1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01
                  1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/>
              </svg>
              pretext-tables
            </a>
          </div>
        </div>
      </nav>
    </>
  )
}
