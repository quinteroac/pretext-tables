/**
 * Reference implementation: ResizableTable
 *
 * Columns resize via drag handles. Row heights recompute via layout() on every
 * pixel of drag — no reflow, no getBoundingClientRect.
 *
 * Key pattern: `prepared` from useMeasure is passed to useResizePreview so
 * prepare() never runs again during a drag — only the cheap layout() phase does.
 */
import { useState, useEffect, useRef, useCallback } from 'react'
import type React from 'react'
import { useMeasure } from './useMeasure'
import type { Row } from './useMeasure'
import { layout } from '@chenglou/pretext'
import type { PreparedTextWithSegments } from '@chenglou/pretext'

const MIN_COL_WIDTH = 60
const LINE_HEIGHT = 20
const CELL_PADDING = 16

interface ResizableTableProps {
  rows: Row[]
  headers: string[]
  defaultColumnWidths: number[]
  font?: string
}

export function ResizableTable({ rows, headers, defaultColumnWidths, font }: ResizableTableProps) {
  const [columnWidths, setColumnWidths] = useState(defaultColumnWidths)

  // Drag state
  const dragRef = useRef<{ colIndex: number; startX: number; startWidth: number } | null>(null)

  useEffect(() => {
    function onMouseMove(e: MouseEvent) {
      if (!dragRef.current) return
      const { colIndex, startX, startWidth } = dragRef.current
      const newWidth = Math.max(startWidth + e.clientX - startX, MIN_COL_WIDTH)
      setColumnWidths((prev) => prev.map((w, i) => (i === colIndex ? newWidth : w)))
    }
    function onMouseUp() { dragRef.current = null }
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
    return () => {
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
    }
  }, [])

  // prepare() runs only when rows/font change; layout() runs on every columnWidths change
  const { rowHeights, prepared } = useMeasure(rows, columnWidths, {
    font,
    lineHeight: LINE_HEIGHT,
    cellPadding: CELL_PADDING,
  })

  // Shrink-wrap: auto-size column to tightest wrap-free width on double-click
  const preparedRef = useRef<PreparedTextWithSegments[][] | null>(null)
  useEffect(() => { preparedRef.current = prepared }, [prepared])

  const handleDblClick = useCallback((colIndex: number) => {
    if (!preparedRef.current) return
    let maxWidth = MIN_COL_WIDTH
    for (const row of preparedRef.current) {
      const cell = row[colIndex]
      if (!cell) continue
      // Binary search for the tightest width where the cell fits in one line
      let lo = MIN_COL_WIDTH, hi = 800
      while (lo < hi) {
        const mid = (lo + hi) >>> 1
        const h = layout(cell, mid - CELL_PADDING, LINE_HEIGHT).height
        if (h <= LINE_HEIGHT) hi = mid; else lo = mid + 1
      }
      if (lo > maxWidth) maxWidth = lo
    }
    setColumnWidths((prev) => prev.map((w, i) => (i === colIndex ? maxWidth : w)))
  }, [])

  return (
    <table style={{ borderCollapse: 'collapse', tableLayout: 'fixed' }}>
      <thead>
        <tr>
          {headers.map((header, colIndex) => (
            <th
              key={colIndex}
              style={{ width: columnWidths[colIndex], position: 'relative', userSelect: 'none' }}
            >
              {header}
              {colIndex < headers.length - 1 && (
                <span
                  style={{
                    position: 'absolute', right: 0, top: 0, bottom: 0,
                    width: 6, cursor: 'col-resize',
                  }}
                  onMouseDown={(e) => {
                    e.preventDefault()
                    dragRef.current = { colIndex, startX: e.clientX, startWidth: columnWidths[colIndex] }
                  }}
                  onDoubleClick={() => handleDblClick(colIndex)}
                />
              )}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, rowIndex) => (
          <tr key={row.id} style={{ height: rowHeights[rowIndex] }}>
            {row.cells.map((cell, colIndex) => (
              <td key={colIndex} style={{ width: columnWidths[colIndex], maxWidth: columnWidths[colIndex], overflow: 'hidden', padding: '0 8px' }}>
                {cell}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  )
}
