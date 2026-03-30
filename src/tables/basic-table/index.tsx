import type React from 'react'
import type { Row } from '../../shared/types.js'
import { useMeasure } from '../../shared/hooks/useMeasure.js'
import { BODY_FONT } from '../../shared/fonts.js'
import { LINE_HEIGHT, CELL_PADDING } from './measure.js'
import './basic-table.css'

export interface BasicTableProps {
  rows: Row[]
  columnWidths: number[]
  renderCell?: (value: string, rowIndex: number, colIndex: number) => React.ReactNode
}

export function BasicTable({ rows, columnWidths, renderCell }: BasicTableProps) {
  const rowHeights = useMeasure(rows, columnWidths, { lineHeight: LINE_HEIGHT, cellPadding: CELL_PADDING })

  return (
    <table className="basic-table" style={{ '--basic-table-font': BODY_FONT } as React.CSSProperties}>
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
  )
}
