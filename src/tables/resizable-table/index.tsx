import type React from 'react'
import { useRef, useCallback, useEffect, useState } from 'react'
import type { PreparedTextWithSegments } from '@chenglou/pretext'
import type { Row } from '../../shared/types.js'
import { LINE_HEIGHT, CELL_PADDING, MIN_COLUMN_WIDTH } from './measure.js'
import { useMeasure } from '../../shared/hooks/useMeasure.js'
import { useResizable } from '../../shared/hooks/useResizable.js'
import { useResizePreview } from '../../shared/hooks/useResizePreview.js'
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
  /**
   * When `true`, dragging a column handle shows a translucent ghost overlay of
   * the dragged column with reflow-preview heights. Real row heights are frozen
   * until the drag ends (pointerup). Uses `useResizePreview` internally.
   * Default false.
   */
  resizePreview?: boolean
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
  resizePreview = false,
  renderCell,
}: ResizableTableProps) {
  const { columnWidths, setColumnWidths, manualRowHeights, getColHandleProps, getRowHandleProps, previewDragState } =
    useResizable({
      defaultColumnWidths,
      minColumnWidth: MIN_COLUMN_WIDTH,
      horizontal,
      rowCount: rows.length,
      vertical,
    })

  // When resizePreview is active, freeze column widths fed into useMeasure so
  // real row heights don't change during a drag — only the ghost layer updates.
  const [committedColumnWidths, setCommittedColumnWidths] = useState(defaultColumnWidths)

  useEffect(() => {
    if (!resizePreview) return
    // Sync committed widths whenever there is no active drag (including drag-end).
    if (previewDragState === null) {
      setCommittedColumnWidths([...columnWidths])
    }
  }, [previewDragState, columnWidths, resizePreview])

  // Use committed (frozen) widths for real height computation during preview drags.
  const measureColumnWidths = resizePreview && previewDragState !== null ? committedColumnWidths : columnWidths

  // layout() re-runs on every columnWidths change — prepare() only when rows change.
  const { rowHeights: pretextRowHeights, prepared } = useMeasure(rows, measureColumnWidths, {
    lineHeight: LINE_HEIGHT,
    cellPadding: CELL_PADDING,
  })

  // Ghost preview heights — null when no drag is active or resizePreview is off.
  const { previewHeights } = useResizePreview(prepared, resizePreview ? previewDragState : null, {
    columnWidths: committedColumnWidths,
    lineHeight: LINE_HEIGHT,
    cellPadding: CELL_PADDING,
  })

  // Header height for ghost overlay positioning (visual only — not cell sizing).
  const theadRef = useRef<HTMLTableSectionElement>(null)
  const [headerHeight, setHeaderHeight] = useState(36)

  useEffect(() => {
    if (resizePreview && theadRef.current) {
      setHeaderHeight(theadRef.current.offsetHeight)
    }
  }, [resizePreview, rows])

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
        <thead ref={theadRef}>
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

      {/* Ghost overlay — absolutely-positioned column showing reflow-preview heights */}
      {resizePreview && previewDragState !== null && previewHeights !== null && (
        <div
          className="resizable-table-ghost"
          style={{
            left: committedColumnWidths.slice(0, previewDragState.colIndex).reduce((sum, w) => sum + w, 0),
            width: previewDragState.currentWidth,
            top: headerHeight,
          }}
          aria-hidden="true"
        >
          {previewHeights.map((height, i) => (
            <div key={i} className="resizable-table-ghost-cell" style={{ height }} />
          ))}
        </div>
      )}
    </div>
  )
}
