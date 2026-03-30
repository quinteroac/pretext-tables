import type React from 'react'
import type { Row } from '../../shared/types.js'
import { useMeasure } from '../../shared/hooks/useMeasure.js'
import { useSortable } from '../../shared/hooks/useSortable.js'
import { BODY_FONT, HEADER_FONT } from '../../shared/fonts.js'
import { LINE_HEIGHT, CELL_PADDING } from './measure.js'
import './column-controls-table.css'

export interface ColumnControlsTableProps {
  rows: Row[]
  headers: string[]
  columnWidths: number[]
  renderCell?: (value: string, rowIndex: number, colIndex: number) => React.ReactNode
}

export function ColumnControlsTable({
  rows,
  headers,
  columnWidths,
  renderCell,
}: ColumnControlsTableProps) {
  const { sortState, sortedRows, onHeaderClick } = useSortable(rows)
  const rowHeights = useMeasure(sortedRows, columnWidths, {
    lineHeight: LINE_HEIGHT,
    cellPadding: CELL_PADDING,
  })

  return (
    <table
      className="cc-table"
      style={{ '--cc-table-font': BODY_FONT } as React.CSSProperties}
    >
      <thead>
        <tr>
          {headers.map((header, colIndex) => (
            <th
              key={colIndex}
              style={{
                width: columnWidths[colIndex],
                maxWidth: columnWidths[colIndex],
                font: HEADER_FONT,
              }}
              onClick={() => onHeaderClick(colIndex)}
            >
              {header}
              {sortState.column === colIndex && sortState.direction !== 'none' && (
                <span className="cc-table-sort-indicator">
                  {sortState.direction === 'asc' ? '▲' : '▼'}
                </span>
              )}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {sortedRows.map((row, rowIndex) => (
          <tr key={row.id} style={{ height: rowHeights[rowIndex] }}>
            {row.cells.map((cell, colIndex) => (
              <td
                key={colIndex}
                style={{
                  width: columnWidths[colIndex],
                  maxWidth: columnWidths[colIndex],
                }}
              >
                {renderCell ? renderCell(cell, rowIndex, colIndex) : cell}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  )
}
