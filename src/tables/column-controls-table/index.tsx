import type React from 'react'
import type { Row } from '../../shared/types.js'
import { useMeasure } from '../../shared/hooks/useMeasure.js'
import { useSortable } from '../../shared/hooks/useSortable.js'
import { useColumnControls } from '../../shared/hooks/useColumnControls.js'
import { BODY_FONT, HEADER_FONT } from '../../shared/fonts.js'
import { LINE_HEIGHT, CELL_PADDING } from './measure.js'
import './column-controls-table.css'

export interface ColumnControlsTableProps {
  rows: Row[]
  headers: string[]
  columnWidths: number[]
  /** Column indices to hide initially. Defaults to none. */
  initialHidden?: number[]
  renderCell?: (value: string, rowIndex: number, colIndex: number) => React.ReactNode
}

export function ColumnControlsTable({
  rows,
  headers,
  columnWidths,
  initialHidden,
  renderCell,
}: ColumnControlsTableProps) {
  const { sortState, sortedRows, onHeaderClick } = useSortable(rows)
  const { visibility, visibleIndices, toggleColumn, isLastVisible } =
    useColumnControls({ columnCount: headers.length, initialHidden })

  // Only measure visible columns
  const visibleWidths = visibleIndices.map((i) => columnWidths[i]!)
  const visibleRows: Row[] = sortedRows.map((row) => ({
    id: row.id,
    cells: visibleIndices.map((i) => row.cells[i]!),
  }))

  const rowHeights = useMeasure(visibleRows, visibleWidths, {
    lineHeight: LINE_HEIGHT,
    cellPadding: CELL_PADDING,
  })

  return (
    <div className="cc-wrapper">
      <div className="cc-visibility-controls" role="group" aria-label="Column visibility">
        {headers.map((header, colIndex) => {
          const last = isLastVisible(colIndex)
          return (
            <label
              key={colIndex}
              className={`cc-visibility-toggle${visibility[colIndex] ? ' cc-visibility-toggle--active' : ''}${last ? ' cc-visibility-toggle--disabled' : ''}`}
            >
              <input
                type="checkbox"
                checked={visibility[colIndex]!}
                disabled={last}
                onChange={() => toggleColumn(colIndex)}
              />
              {header}
            </label>
          )
        })}
      </div>

      <table
        className="cc-table"
        style={{ '--cc-table-font': BODY_FONT } as React.CSSProperties}
      >
        <thead>
          <tr>
            {visibleIndices.map((colIndex) => (
              <th
                key={colIndex}
                style={{
                  width: columnWidths[colIndex],
                  maxWidth: columnWidths[colIndex],
                  font: HEADER_FONT,
                }}
                onClick={() => onHeaderClick(colIndex)}
              >
                {headers[colIndex]}
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
              {visibleIndices.map((colIndex) => (
                <td
                  key={colIndex}
                  style={{
                    width: columnWidths[colIndex],
                    maxWidth: columnWidths[colIndex],
                  }}
                >
                  {renderCell
                    ? renderCell(row.cells[colIndex]!, rowIndex, colIndex)
                    : row.cells[colIndex]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
