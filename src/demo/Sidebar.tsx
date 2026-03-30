
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

export function Sidebar() {
  return (
    <nav className="demo-sidebar" aria-label="Demo sections">
      <div className="demo-sidebar__inner">
        <p className="demo-sidebar__heading">sections</p>
        <ul className="demo-sidebar__list">
          {DEMO_SECTIONS.map(({ id, label }) => (
            <li key={id} className="demo-sidebar__item">
              <a className="demo-sidebar__link" href={`#${id}`}>
                {label}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  )
}
