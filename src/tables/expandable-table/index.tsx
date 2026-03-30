import type React from 'react'
import type { Row } from '../../shared/types.js'
import { LINE_HEIGHT, CELL_PADDING, MIN_COLUMN_WIDTH } from './measure.js'
import { useMeasure } from '../../shared/hooks/useMeasure.js'
import { useExpandable } from '../../shared/hooks/useExpandable.js'
import { useResizable } from '../../shared/hooks/useResizable.js'
import { BODY_FONT, HEADER_FONT } from '../../shared/fonts.js'
import './expandable-table.css'

export interface ExpandableTableProps {
  rows: Row[]
  headers: string[]
  defaultColumnWidths: number[]
  renderCell?: (value: string, rowIndex: number, colIndex: number) => React.ReactNode
}

/**
 * A table that scales all columns proportionally when its container resizes.
 * The wrapper has `resize: horizontal` so users can drag the right edge.
 * All measuring is done with @chenglou/pretext — no DOM layout calls.
 */
export function ExpandableTable({ rows, headers, defaultColumnWidths, renderCell }: ExpandableTableProps) {
  const { columnWidths, setColumnWidths } = useResizable({
    defaultColumnWidths,
    minColumnWidth: MIN_COLUMN_WIDTH,
    horizontal: false,
    vertical: false,
  })

  // Watch the container. Scale columns proportionally only when WIDTH changes.
  // Height-only changes (vertical drag) are ignored here — row heights recompute
  // via useMeasure as needed. Only layout() runs downstream — never prepare().
  const containerRef = useExpandable({
    onResize(newWidth, _h, prevWidth) {
      if (newWidth === prevWidth) return
      const ratio = newWidth / prevWidth
      setColumnWidths((prev) => prev.map((w) => Math.max(w * ratio, MIN_COLUMN_WIDTH)))
    },
  })

  const rowHeights = useMeasure(rows, columnWidths, {
    lineHeight: LINE_HEIGHT,
    cellPadding: CELL_PADDING,
  })

  return (
    <div ref={containerRef} className="expandable-table-container">
      <table
        className="expandable-table"
        style={
          {
            '--expandable-table-font': BODY_FONT,
            '--expandable-table-header-font': HEADER_FONT,
          } as React.CSSProperties
        }
      >
        <thead>
          <tr>
            {headers.map((header, colIndex) => (
              <th
                key={colIndex}
                style={{ width: columnWidths[colIndex], maxWidth: columnWidths[colIndex] }}
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={row.id} style={{ height: rowHeights[rowIndex] }}>
              {row.cells.map((cell, colIndex) => (
                <td
                  key={colIndex}
                  style={{ width: columnWidths[colIndex], maxWidth: columnWidths[colIndex] }}
                >
                  {renderCell ? renderCell(cell, rowIndex, colIndex) : cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

