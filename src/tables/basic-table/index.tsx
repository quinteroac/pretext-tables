import { useMemo } from 'react'
import type { Column, TableRow } from '../../shared/types.js'
import { useFontsReady } from '../../shared/hooks.js'
import { measureRowHeights, LINE_HEIGHT } from './measure.js'
import { BODY_FONT } from '../../shared/fonts.js'
import './basic-table.css'

export interface BasicTableProps {
  rows: TableRow[]
  columns: Column[]
}

export function BasicTable({ rows, columns }: BasicTableProps) {
  const fontsReady = useFontsReady()

  const columnWidths = columns.map(c => c.width ?? 0)

  const rowHeights = useMemo(() => {
    if (!fontsReady) return rows.map(() => LINE_HEIGHT)
    return measureRowHeights(rows, columns)
  }, [rows, columns, fontsReady])

  return (
    <table className="basic-table" style={{ '--basic-table-font': BODY_FONT } as React.CSSProperties}>
      <thead>
        <tr>
          {columns.map((col, colIndex) => (
            <th key={col.key} style={{ width: columnWidths[colIndex], maxWidth: columnWidths[colIndex] }}>
              {col.header}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, rowIndex) => (
          <tr key={row.id} style={{ height: rowHeights[rowIndex] }}>
            {columns.map((col, colIndex) => (
              <td
                key={col.key}
                style={{ width: columnWidths[colIndex], maxWidth: columnWidths[colIndex] }}
              >
                {row[col.key] ?? ''}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  )
}
