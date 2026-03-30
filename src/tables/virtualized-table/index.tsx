import { useState, useEffect, useRef } from 'react'
import type React from 'react'
import type { Row } from '../../shared/types.js'
import { useMeasure } from '../../shared/hooks/useMeasure.js'
import { useVirtualization } from '../../shared/hooks/useVirtualization.js'
import { BODY_FONT } from '../../shared/fonts.js'
import { LINE_HEIGHT, CELL_PADDING } from './measure.js'
import './virtualized-table.css'

export interface VirtualizedTableProps {
  rows: Row[]
  columnWidths: number[]
  /** Height of the scrollable viewport in px. */
  height: number
  /**
   * Number of extra rows to render above and below the visible range.
   * Reduces blank flashes during fast scrolling. Default 3.
   */
  overscan?: number
  renderCell?: (value: string, rowIndex: number, colIndex: number) => React.ReactNode
}

/**
 * A virtualized table that renders only the rows visible in the scroll viewport.
 * All row heights are computed by @chenglou/pretext before any DOM rendering —
 * no getBoundingClientRect, no layout thrash, no height estimation.
 */
export function VirtualizedTable({ rows, columnWidths, height, overscan = 3, renderCell }: VirtualizedTableProps) {
  const [scrollTop, setScrollTop] = useState(0)
  const viewportRef = useRef<HTMLDivElement>(null)

  const { rowHeights } = useMeasure(rows, columnWidths, { lineHeight: LINE_HEIGHT, cellPadding: CELL_PADDING })

  const { startIndex, endIndex, totalHeight, offsets } = useVirtualization({
    rowHeights,
    scrollTop,
    viewportHeight: height,
    overscan,
  })

  // Reset scroll to top when the row dataset changes.
  useEffect(() => {
    setScrollTop(0)
    if (viewportRef.current) viewportRef.current.scrollTop = 0
  }, [rows])

  function handleScroll(e: React.UIEvent<HTMLDivElement>) {
    setScrollTop(e.currentTarget.scrollTop)
  }

  return (
    <div
      ref={viewportRef}
      className="vt-viewport"
      style={{ height, '--vt-font': BODY_FONT } as React.CSSProperties}
      onScroll={handleScroll}
    >
      <div className="vt-inner" style={{ height: totalHeight }}>
        {rows.slice(startIndex, endIndex + 1).map((row, i) => {
          const rowIndex = startIndex + i
          return (
            <div
              key={row.id}
              className={`vt-row${rowIndex % 2 === 1 ? ' vt-row--even' : ''}`}
              style={{
                top: offsets[rowIndex],
                height: rowHeights[rowIndex],
              }}
            >
              {row.cells.map((cell, colIndex) => (
                <div
                  key={colIndex}
                  className="vt-cell"
                  style={{ width: columnWidths[colIndex], maxWidth: columnWidths[colIndex] }}
                >
                  {renderCell ? renderCell(cell, rowIndex, colIndex) : cell}
                </div>
              ))}
            </div>
          )
        })}
      </div>
    </div>
  )
}
