import React, { useEffect, useMemo, useRef, useState } from 'react'
import type { Column, TableRow } from '../../shared/types'
import { useFontsReady } from '../../shared/hooks'
import { useColumnResize } from '../../shared/hooks/useColumnResize'
import { BODY_FONT, BODY_LINE_HEIGHT } from '../../shared/fonts'
import { prepareRows, computeRowHeights } from './measure'
import { BaseTable } from '../base-table'
import './resizable-table.css'

// ── Padding constants (must match CSS .rt-td padding) ────────────────────────
// 12px top + 12px bottom = 24px total vertical padding
const CELL_PADDING_V = 24
// Header row visual height (matches .rt-th height set inline)
const HEADER_HEIGHT = 44

export interface ResizableTableProps {
  columns: Column[]
  rows: TableRow[]
}

/**
 * Resolve initial column widths from props and the known container width.
 * Columns with width > 0 keep their explicit width.
 * Columns with width === 0 (or undefined) share the remaining space equally.
 * Returns null if containerWidth is not yet known (> 0).
 */
function resolveInitialWidths(columns: Column[], containerWidth: number): number[] | null {
  if (containerWidth <= 0) return null

  const fixedTotal = columns.reduce((sum, c) => sum + (c.width ?? 0), 0)
  const autoCount = columns.filter(c => !(c.width && c.width > 0)).length

  const remaining = Math.max(0, containerWidth - fixedTotal)
  const autoWidth = autoCount > 0 ? Math.floor(remaining / autoCount) : 0

  return columns.map(c => (c.width && c.width > 0 ? c.width : autoWidth))
}

export function ResizableTable({ columns, rows }: ResizableTableProps): React.JSX.Element {
  // ── Wait for fonts before measuring ────────────────────────────────────────
  // Measuring before fonts load silently falls back to a system font,
  // producing wrong widths. We flip fontsReady only after document.fonts.ready.
  const fontsReady = useFontsReady()

  // ── Container ref + ResizeObserver for container width ─────────────────────
  // ResizeObserver fires when the wrapper element changes size. We use this
  // only to discover the container width on mount (layout-neutral operation).
  const containerRef = useRef<HTMLDivElement>(null)
  const [containerWidth, setContainerWidth] = useState(0)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    const observer = new ResizeObserver(entries => {
      const entry = entries[0]
      if (!entry) return
      // Use contentBoxSize when available for sub-pixel accuracy.
      const w = entry.contentBoxSize
        ? entry.contentBoxSize[0]?.inlineSize ?? entry.contentRect.width
        : entry.contentRect.width
      setContainerWidth(Math.floor(w))
    })

    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  // ── Determine whether all columns have explicit widths ──────────────────────
  const hasAutoColumns = columns.some(c => !(c.width && c.width > 0))

  // ── Column widths via useColumnResize hook ──────────────────────────────────
  const { columnWidths, setColumnWidths, startResize } = useColumnResize(
    columns.map(c => c.width ?? 0)
  )

  // Track whether container-width distribution has been applied for current columns.
  const widthsResolvedRef = useRef(false)

  // Keep columnWidths in sync when the columns prop changes (e.g. new dataset).
  const prevColumnsRef = useRef(columns)
  if (prevColumnsRef.current !== columns) {
    prevColumnsRef.current = columns
    // Reset resolved flag so we recompute for the new column set.
    widthsResolvedRef.current = false
    // Direct mutation during render is safe here — synchronous bailout pattern.
    setColumnWidths(columns.map(c => c.width ?? 0))
  }

  // Apply container-width distribution once fonts are ready and container is measured.
  // Only runs when there are auto columns and widths haven't been resolved yet.
  useEffect(() => {
    if (!fontsReady) return
    if (!hasAutoColumns) {
      // All columns have explicit widths — mark resolved immediately.
      widthsResolvedRef.current = true
      return
    }
    if (containerWidth <= 0) return
    if (widthsResolvedRef.current) return

    const resolved = resolveInitialWidths(columns, containerWidth)
    if (!resolved) return

    widthsResolvedRef.current = true
    setColumnWidths(resolved)
  }, [fontsReady, hasAutoColumns, containerWidth, columns, setColumnWidths])

  // widthsResolved drives visibility: we hide the table until widths are settled
  // to avoid a layout flash (wrong widths → jump to correct widths).
  const widthsResolved =
    !hasAutoColumns
      ? fontsReady  // explicit widths: ready as soon as fonts load
      : fontsReady && containerWidth > 0 && widthsResolvedRef.current

  // ── Prepare all cells once when rows/columns/font change ────────────────────
  // prepare() uses Canvas API and costs ~19 ms per 500 texts.
  // It is memoized here so it never runs during a re-render.
  // fontsReady is in deps so measuring waits for the correct font metrics.
  const preparedCells = useMemo(() => {
    if (!fontsReady || rows.length === 0) return []
    return prepareRows(rows, columns, BODY_FONT)
  }, [fontsReady, rows, columns])

  // ── Compute per-row heights using pure layout() arithmetic ──────────────────
  // columnWidths is the only dep that changes during resize — layout() is pure
  // arithmetic so this is cheap and never touches the DOM.
  const rowHeights = useMemo(() => {
    if (preparedCells.length === 0) return []
    return computeRowHeights(preparedCells, columnWidths, BODY_LINE_HEIGHT, CELL_PADDING_V + BODY_LINE_HEIGHT)
  }, [preparedCells, columnWidths])

  // ── Loading skeleton while fonts are loading ─────────────────────────────────
  if (!fontsReady) {
    return (
      <div className="rt-wrapper" ref={containerRef}>
        <div className="rt-loading" aria-label="Loading table…" aria-busy="true">
          {[0, 1, 2, 3].map(i => (
            <div key={i} className="rt-skeleton-row">
              <div className="rt-skeleton-cell" />
              <div className="rt-skeleton-cell" />
              <div className="rt-skeleton-cell" />
              <div className="rt-skeleton-cell" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  // ── Empty state ───────────────────────────────────────────────────────────────
  if (rows.length === 0) {
    return (
      <div className="rt-wrapper" ref={containerRef}>
        <div className="rt-empty" role="status">
          <p className="rt-empty-heading">No records</p>
          <p className="rt-empty-sub">Pass rows to see the table.</p>
        </div>
      </div>
    )
  }

  return (
    // visibility:hidden until widths are resolved prevents a layout flash.
    // The element still occupies its space, so there's no reflow on reveal.
    <div
      className="rt-wrapper"
      ref={containerRef}
      style={!widthsResolved ? { visibility: 'hidden' } : undefined}
    >
      <BaseTable
        columns={columns}
        columnWidths={columnWidths}
        rows={rows}
        rowHeights={rowHeights}
        headerHeight={HEADER_HEIGHT}
        className="rt-base"
        renderResizeHandle={(colIdx) => (
          <span
            className="rt-resize-handle"
            aria-hidden="true"
            onMouseDown={e => { e.preventDefault(); startResize(colIdx, e.clientX) }}
          />
        )}
      />
    </div>
  )
}
