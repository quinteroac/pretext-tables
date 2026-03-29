import { useMemo, useState, useEffect } from 'react'
import type { Row } from '../../shared/types.js'
import { measureRowHeights, LINE_HEIGHT } from './measure.js'
import { BODY_FONT } from '../../shared/fonts.js'
import './basic-table.css'

export interface BasicTableProps {
  rows: Row[]
  columnWidths: number[]
}

export function BasicTable({ rows, columnWidths }: BasicTableProps) {
  const [fontsReady, setFontsReady] = useState(false)

  useEffect(() => {
    document.fonts.ready.then(() => {
      setFontsReady(true)
    })
  }, [])

  const rowHeights = useMemo(() => {
    if (!fontsReady) return rows.map(() => LINE_HEIGHT)
    return measureRowHeights(rows, columnWidths)
  }, [rows, columnWidths, fontsReady])

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
