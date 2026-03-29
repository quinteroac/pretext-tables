import type { Row } from '../../shared/types.js'
import { useMeasure } from '../../shared/hooks/useMeasure.js'
import { BODY_FONT } from '../../shared/fonts.js'
import { LINE_HEIGHT, CELL_PADDING } from './measure.js'
import './basic-table.css'

export interface BasicTableProps {
  rows: Row[]
  columnWidths: number[]
}

export function BasicTable({ rows, columnWidths }: BasicTableProps) {
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
                {cell}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  )
}
