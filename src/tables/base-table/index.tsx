import React from 'react'
import type { Column, TableRow } from '../../shared/types'
import './base-table.css'

export interface BaseTableProps {
  columns: Column[]
  columnWidths: number[]
  rows: TableRow[]
  rowHeights: number[]
  headerHeight?: number
  renderResizeHandle?: (colIdx: number) => React.ReactNode
  className?: string
}

export function BaseTable({
  columns,
  columnWidths,
  rows,
  rowHeights,
  headerHeight,
  renderResizeHandle,
  className,
}: BaseTableProps): React.JSX.Element {
  const totalWidth = columnWidths.reduce((sum, w) => sum + w, 0)

  return (
    <div className={`bt-wrapper${className ? ` ${className}` : ''}`}>
      <div className="bt-scroll">
        <table
          className="bt-table"
          style={{ width: totalWidth }}
          role="table"
          aria-rowcount={rows.length + 1}
        >
          <thead className="bt-thead">
            <tr role="row">
              {columns.map((col, colIdx) => (
                <th
                  key={col.key}
                  className="bt-th"
                  scope="col"
                  style={{
                    width: columnWidths[colIdx] ?? (col.width ?? 0),
                    ...(headerHeight !== undefined ? { height: headerHeight } : {}),
                  }}
                >
                  <span className="bt-th-label">{col.header}</span>
                  {renderResizeHandle ? renderResizeHandle(colIdx) : null}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bt-tbody">
            {rows.map((row, rowIdx) => (
              <tr
                key={row.id ?? rowIdx}
                role="row"
                aria-rowindex={rowIdx + 2}
              >
                {columns.map((col, colIdx) => {
                  const value = row[col.key]
                  const display: string = value == null ? '' : String(value)
                  return (
                    <td
                      key={col.key}
                      className="bt-td"
                      role="cell"
                      style={{
                        width: columnWidths[colIdx] ?? (col.width ?? 0),
                        height: rowHeights[rowIdx] ?? 'auto',
                      }}
                    >
                      {display}
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
