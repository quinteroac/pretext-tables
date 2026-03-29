import type { Row } from '../../shared/types.js'
import { LINE_HEIGHT, CELL_PADDING, MIN_COLUMN_WIDTH } from './measure.js'
import { useMeasure } from '../../shared/hooks/useMeasure.js'
import { useResizable } from '../../shared/hooks/useResizable.js'
import { BODY_FONT, HEADER_FONT } from '../../shared/fonts.js'
import './resizable-table.css'

export interface ResizableTableProps {
  rows: Row[]
  headers: string[]
  defaultColumnWidths: number[]
  /** Enable horizontal column-resize handles. Default true. */
  horizontal?: boolean
  /** Enable vertical row-resize handles. Default false. */
  vertical?: boolean
}

/**
 * A table with drag handles for resizing individual columns and/or rows.
 * Uses @chenglou/pretext to measure row heights without DOM layout calls.
 */
export function ResizableTable({
  rows,
  headers,
  defaultColumnWidths,
  horizontal = true,
  vertical = false,
}: ResizableTableProps) {
  const { columnWidths, manualRowHeights, getColHandleProps, getRowHandleProps } =
    useResizable({
      defaultColumnWidths,
      minColumnWidth: MIN_COLUMN_WIDTH,
      horizontal,
      rowCount: rows.length,
      vertical,
    })

  // layout() re-runs on every columnWidths change — prepare() only when rows change.
  const pretextRowHeights = useMeasure(rows, columnWidths, {
    lineHeight: LINE_HEIGHT,
    cellPadding: CELL_PADDING,
  })

  // Merge pretext heights with user-dragged row overrides.
  const rowHeights = pretextRowHeights.map((h, i) =>
    manualRowHeights[i] !== undefined ? manualRowHeights[i]! : h
  )

  return (
    <div className="resizable-table-container">
      <table
        className="resizable-table"
        style={
          {
            '--resizable-table-font': BODY_FONT,
            '--resizable-table-header-font': HEADER_FONT,
          } as React.CSSProperties
        }
      >
        <thead>
          <tr>
            {headers.map((header, colIndex) => (
              <th
                key={colIndex}
                style={{ width: columnWidths[colIndex], maxWidth: columnWidths[colIndex] }}
              >
                <span className="resizable-table-header-text">{header}</span>
                {horizontal && colIndex < headers.length - 1 && (
                  <span
                    className="resizable-table-handle resizable-table-handle--col"
                    {...getColHandleProps(colIndex)}
                    title="Drag to resize column"
                  />
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={row.id} style={{ height: rowHeights[rowIndex] }}>
              {row.cells.map((cell, colIndex) => {
                const isLast = colIndex === row.cells.length - 1
                return (
                  <td
                    key={colIndex}
                    style={{ width: columnWidths[colIndex], maxWidth: columnWidths[colIndex] }}
                    className={vertical && isLast ? 'resizable-table-td--last' : undefined}
                  >
                    {cell}
                    {vertical && isLast && (
                      <span
                        className="resizable-table-handle resizable-table-handle--row"
                        {...getRowHandleProps(rowIndex, rowHeights[rowIndex])}
                        title="Drag to resize row"
                      />
                    )}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
