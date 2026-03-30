import type React from 'react'
import { useRef, useCallback, useEffect } from 'react'
import type { PreparedTextWithSegments } from '@chenglou/pretext'
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
  /**
   * When `true`, double-clicking a column handle auto-sizes that column to its
   * tightest wrap-free width. Uses a lazy dynamic import of `useShrinkWrap` so
   * the module is not bundled when the prop is omitted. Default false.
   */
  shrinkWrap?: boolean
  renderCell?: (value: string, rowIndex: number, colIndex: number) => React.ReactNode
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
  shrinkWrap = false,
  renderCell,
}: ResizableTableProps) {
  const { columnWidths, setColumnWidths, manualRowHeights, getColHandleProps, getRowHandleProps } =
    useResizable({
      defaultColumnWidths,
      minColumnWidth: MIN_COLUMN_WIDTH,
      horizontal,
      rowCount: rows.length,
      vertical,
    })

  // layout() re-runs on every columnWidths change — prepare() only when rows change.
  const { rowHeights: pretextRowHeights, prepared } = useMeasure(rows, columnWidths, {
    lineHeight: LINE_HEIGHT,
    cellPadding: CELL_PADDING,
  })

  // Keep a stable ref so the async double-click handler always reads the latest
  // prepared grid without needing to capture it in its dependency array.
  const preparedRef = useRef<PreparedTextWithSegments[][] | null>(prepared)
  useEffect(() => { preparedRef.current = prepared }, [prepared])

  // Lazy import: `useShrinkWrap` (and its transitive dep `walkLineRanges`) are
  // NOT included in the initial bundle — they are fetched on first double-click
  // only when shrinkWrap=true.  Satisfies AC03 (tree-shaking / lazy import).
  const handleColDblClick = useCallback(
    async (colIndex: number) => {
      if (!preparedRef.current) return
      const { shrinkWrapColumn } = await import('../../shared/hooks/useShrinkWrap.js')
      const cells = preparedRef.current
        .map((row) => row[colIndex])
        .filter((c): c is PreparedTextWithSegments => c != null)
      const newWidth = shrinkWrapColumn(cells, {
        cellPadding: CELL_PADDING,
        minWidth: MIN_COLUMN_WIDTH,
      })
      setColumnWidths((prev) => prev.map((w, i) => (i === colIndex ? newWidth : w)))
    },
    [setColumnWidths]
  )

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
                    onDoubleClick={shrinkWrap ? () => void handleColDblClick(colIndex) : undefined}
                    tabIndex={0}
                    role="separator"
                    aria-label={`Resize ${headers[colIndex]} column`}
                    title={
                      shrinkWrap
                        ? 'Double-click to auto-size; drag to resize'
                        : 'Drag to resize this column'
                    }
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
                    {renderCell ? renderCell(cell, rowIndex, colIndex) : cell}
                    {vertical && isLast && (
                      <span
                        className="resizable-table-handle resizable-table-handle--row"
                        {...getRowHandleProps(rowIndex, rowHeights[rowIndex])}
                        tabIndex={0}
                        role="separator"
                        aria-label={`Resize row ${rowIndex + 1} height`}
                        title="Drag to set row height"
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
