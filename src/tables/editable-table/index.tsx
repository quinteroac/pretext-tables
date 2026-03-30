import type React from 'react'
import type { Row } from '../../shared/types.js'
import { useEditable } from '../../shared/hooks/useEditable.js'
import { BODY_FONT } from '../../shared/fonts.js'
import { LINE_HEIGHT, CELL_PADDING } from './measure.js'
import './editable-table.css'

export interface EditableTableProps {
  rows: Row[]
  /** Column widths in px. Can be sourced from `useResizable` for composed layouts. */
  columnWidths: number[]
  headers?: string[]
  /** Placeholder text per column index. */
  placeholders?: string[]
  /** Called whenever a cell value changes. */
  onCellChange?: (rowIndex: number, colIndex: number, value: string) => void
  renderCell?: (value: string, rowIndex: number, colIndex: number) => React.ReactNode
}

/**
 * A table with inline-editable cells whose row heights update on every
 * keystroke — no DOM reflows, no `getBoundingClientRect`.
 *
 * Uses `useEditable` internally: `prepare()` is debounced (~150 ms) while
 * `layout()` runs on every input event for immediate height feedback.
 *
 * The `columnWidths` prop may come from `useResizable` — resized widths are
 * honoured automatically during editing.
 */
export function EditableTable({
  rows,
  columnWidths,
  headers,
  placeholders,
  onCellChange,
}: EditableTableProps) {
  const { previewHeights, getEditProps } = useEditable(rows, columnWidths, {
    lineHeight: LINE_HEIGHT,
    cellPadding: CELL_PADDING,
  })

  return (
    <table
      className="editable-table"
      style={{ '--editable-table-font': BODY_FONT } as React.CSSProperties}
    >
      {headers && (
        <thead>
          <tr>
            {headers.map((header, colIndex) => (
              <th key={colIndex} style={{ width: columnWidths[colIndex] }}>
                {header}
              </th>
            ))}
          </tr>
        </thead>
      )}
      <tbody>
        {rows.map((row, rowIndex) => (
          <tr key={row.id} style={{ height: previewHeights[rowIndex] }}>
            {row.cells.map((_cell, colIndex) => {
              const editProps = getEditProps(rowIndex, colIndex)
              return (
                <td
                  key={colIndex}
                  style={{ width: columnWidths[colIndex], maxWidth: columnWidths[colIndex] }}
                >
                  <textarea
                    className="editable-table__textarea"
                    placeholder={placeholders?.[colIndex] ?? ''}
                    aria-label={
                      headers
                        ? `Edit ${headers[colIndex] ?? `column ${colIndex + 1}`}, row ${rowIndex + 1}`
                        : `Edit cell row ${rowIndex + 1}, column ${colIndex + 1}`
                    }
                    {...editProps}
                    onChange={(e) => onCellChange?.(rowIndex, colIndex, e.target.value)}
                  />
                </td>
              )
            })}
          </tr>
        ))}
      </tbody>
    </table>
  )
}
