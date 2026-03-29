import { useMemo } from 'react'
import type { Column, TableRow } from '../../shared/types.js'
import { useFontsReady } from '../../shared/hooks.js'
import { measureRowHeights, LINE_HEIGHT } from './measure.js'
import { BODY_FONT } from '../../shared/fonts.js'
import { BaseTable } from '../base-table'
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
    <div className="basic-table-wrapper" style={{ '--basic-table-font': BODY_FONT } as React.CSSProperties}>
      <BaseTable
        columns={columns}
        columnWidths={columnWidths}
        rows={rows}
        rowHeights={rowHeights}
        className="basic-table-base"
      />
    </div>
  )
}
