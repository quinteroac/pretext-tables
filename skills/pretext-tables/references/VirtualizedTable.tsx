/**
 * Reference implementation: VirtualizedTable
 *
 * Renders only the rows visible in the scroll viewport.
 * All row heights are computed by @chenglou/pretext before any DOM rendering.
 * No getBoundingClientRect, no height estimation, no scroll jitter.
 */
import { useState, useEffect, useRef } from 'react'
import type React from 'react'
import { useMeasure } from './useMeasure'
import { useVirtualization } from './useVirtualization'
import type { Row } from './useMeasure'

interface VirtualizedTableProps {
  rows: Row[]
  columnWidths: number[]
  /** Height of the scrollable viewport in px. */
  height: number
  /** Extra rows rendered above/below visible range to avoid blank flashes. Default 3. */
  overscan?: number
  renderCell?: (value: string, rowIndex: number, colIndex: number) => React.ReactNode
  font?: string
}

export function VirtualizedTable({
  rows,
  columnWidths,
  height,
  overscan = 3,
  renderCell,
  font,
}: VirtualizedTableProps) {
  const [scrollTop, setScrollTop] = useState(0)
  const viewportRef = useRef<HTMLDivElement>(null)

  const { rowHeights } = useMeasure(rows, columnWidths, { font, lineHeight: 20, cellPadding: 16 })

  const { startIndex, endIndex, totalHeight, offsets } = useVirtualization({
    rowHeights,
    scrollTop,
    viewportHeight: height,
    overscan,
  })

  // Reset scroll when the dataset is replaced
  useEffect(() => {
    setScrollTop(0)
    if (viewportRef.current) viewportRef.current.scrollTop = 0
  }, [rows])

  return (
    <div
      ref={viewportRef}
      style={{ height, overflowY: 'auto', position: 'relative' }}
      onScroll={(e) => setScrollTop(e.currentTarget.scrollTop)}
    >
      {/* Spacer that represents the full scrollable height */}
      <div style={{ height: totalHeight, position: 'relative' }}>
        {rows.slice(startIndex, endIndex + 1).map((row, i) => {
          const rowIndex = startIndex + i
          return (
            <div
              key={row.id}
              style={{
                position: 'absolute',
                top: offsets[rowIndex],
                height: rowHeights[rowIndex],
                width: '100%',
                display: 'flex',
              }}
            >
              {row.cells.map((cell, colIndex) => (
                <div
                  key={colIndex}
                  style={{
                    width: columnWidths[colIndex],
                    flexShrink: 0,
                    overflow: 'hidden',
                    padding: '0 8px',
                  }}
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
