import type React from 'react'
import type { Row } from '../../shared/types.js'
import { useMeasure } from '../../shared/hooks/useMeasure.js'
import { BODY_FONT, HEADER_FONT } from '../../shared/fonts.js'
import { LINE_HEIGHT, CELL_PADDING } from './measure.js'
import './grid-table.css'

export interface GridTableProps {
  rows: Row[]
  headers: string[]
  columnWidths: number[]
  renderCell?: (value: string, rowIndex: number, colIndex: number) => React.ReactNode
}

/**
 * A CSS Grid-based table with no `<table>`, `<tr>`, or `<td>` elements.
 * Benefits over `<table>`:
 *   - `overflow: hidden` on cells works reliably
 *   - Sticky header is straightforward with `position: sticky; top: 0`
 *   - No `table-layout` interference
 *
 * Row heights are pre-computed by `useMeasure` — zero DOM reflows.
 */
export function GridTable({ rows, headers, columnWidths, renderCell }: GridTableProps) {
  const { rowHeights } = useMeasure(rows, columnWidths, {
    lineHeight: LINE_HEIGHT,
    cellPadding: CELL_PADDING,
  })

  const gridTemplateColumns = columnWidths.map((w) => `${w}px`).join(' ')

  return (
    <div
      className="grid-table-container"
      style={
        {
          '--grid-table-font': BODY_FONT,
          '--grid-table-header-font': HEADER_FONT,
        } as React.CSSProperties
      }
    >
      <div className="grid-table">
        {/* AC04: header row is position: sticky; top: 0 (via CSS) */}
        <div
          className="grid-table-header-row"
          style={{ gridTemplateColumns }}
        >
          {headers.map((header, colIndex) => (
            <div key={colIndex} className="grid-table-header-cell">
              {header}
            </div>
          ))}
        </div>

        {/* AC03: rowHeight applied as explicit height on each row div */}
        {rows.map((row, rowIndex) => (
          <div
            key={row.id}
            className="grid-table-row"
            style={{ gridTemplateColumns, height: rowHeights[rowIndex] }}
          >
            {row.cells.map((cell, colIndex) => (
              /* AC05: overflow: hidden clips content (via CSS) */
              <div key={colIndex} className="grid-table-cell">
                {renderCell ? renderCell(cell, rowIndex, colIndex) : cell}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
