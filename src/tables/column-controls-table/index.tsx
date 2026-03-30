import type React from 'react'
import type { Row } from '../../shared/types.js'
import { useMeasure } from '../../shared/hooks/useMeasure.js'
import { useColumnControls } from '../../shared/hooks/useColumnControls.js'
import type { UseColumnControlsOptions } from '../../shared/hooks/useColumnControls.js'
import { BODY_FONT, HEADER_FONT } from '../../shared/fonts.js'
import { LINE_HEIGHT, CELL_PADDING } from './measure.js'
import './column-controls-table.css'

export interface ColumnControlsTableProps {
  rows: Row[]
  /** Column definitions — id maps to the cell index by position. */
  columns: UseColumnControlsOptions[]
  columnWidths: number[]
  renderCell?: (value: string, rowIndex: number, colIndex: number) => React.ReactNode
}

export function ColumnControlsTable({
  rows,
  columns,
  columnWidths,
  renderCell,
}: ColumnControlsTableProps) {
  const { visibleColumns, allColumns, sortKey, sortDirection, toggleColumnVisibility, setSort } =
    useColumnControls(columns)

  // Map column id → original index for width / cell lookup
  const idToIndex = Object.fromEntries(columns.map((col, i) => [col.id, i]))

  // Only measure visible columns
  const visibleIndices = visibleColumns.map((col) => idToIndex[col.id]!)
  const visibleWidths = visibleIndices.map((i) => columnWidths[i]!)

  // Sort rows by sortKey if active
  const sortColIndex = sortKey !== null ? idToIndex[sortKey] ?? null : null
  const sortedRows: Row[] = (() => {
    if (sortColIndex === null || sortDirection === null) return rows
    const dir = sortDirection === 'asc' ? 1 : -1
    return [...rows].sort((a, b) => dir * (a.cells[sortColIndex] ?? '').localeCompare(b.cells[sortColIndex] ?? ''))
  })()

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
        {allColumns.map((col) => {
          const isLast = visibleColumns.length === 1 && col.visible
          return (
            <label
              key={col.id}
              className={`cc-visibility-toggle${col.visible ? ' cc-visibility-toggle--active' : ''}${isLast ? ' cc-visibility-toggle--disabled' : ''}`}
            >
              <input
                type="checkbox"
                checked={col.visible}
                disabled={isLast}
                onChange={() => toggleColumnVisibility(col.id)}
              />
              {col.label}
            </label>
          )
        })}
      </div>

      <div className="cc-scroll">
        <table
          className="cc-table"
          style={{ '--cc-table-font': BODY_FONT } as React.CSSProperties}
        >
          <thead>
            <tr>
              {visibleColumns.map((col) => {
                const colIndex = idToIndex[col.id]!
                const isSorted = sortKey === col.id
                return (
                  <th
                    key={col.id}
                    style={{
                      width: columnWidths[colIndex],
                      maxWidth: columnWidths[colIndex],
                      font: HEADER_FONT,
                    }}
                    onClick={() => setSort(col.id)}
                  >
                    {col.label}
                    {isSorted && sortDirection !== null && (
                      <span className="cc-table-sort-indicator">
                        {sortDirection === 'asc' ? '▲' : '▼'}
                      </span>
                    )}
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody>
            {sortedRows.map((row, rowIndex) => (
              <tr key={row.id} style={{ height: rowHeights[rowIndex] }}>
                {visibleColumns.map((col) => {
                  const colIndex = idToIndex[col.id]!
                  return (
                    <td
                      key={col.id}
                      style={{
                        width: columnWidths[colIndex],
                        maxWidth: columnWidths[colIndex],
                      }}
                    >
                      {renderCell
                        ? renderCell(row.cells[colIndex]!, rowIndex, colIndex)
                        : row.cells[colIndex]}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
