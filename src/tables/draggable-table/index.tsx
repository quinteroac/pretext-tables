import { useState } from 'react'
import type React from 'react'
import type { Row } from '../../shared/types.js'
import { LINE_HEIGHT, CELL_PADDING } from './measure.js'
import { useMeasure } from '../../shared/hooks/useMeasure.js'
import { useDraggable } from '../../shared/hooks/useDraggable.js'
import { BODY_FONT, HEADER_FONT } from '../../shared/fonts.js'
import './draggable-table.css'

export interface DraggableTableProps {
  rows: Row[]
  headers: string[]
  columnWidths: number[]
  onRowsReorder?: (newOrder: number[]) => void
  onColumnsReorder?: (newOrder: number[]) => void
  renderCell?: (value: string, rowIndex: number, colIndex: number) => React.ReactNode
}

/**
 * A table with drag-to-reorder rows.
 * Uses @chenglou/pretext to measure row heights without DOM layout calls.
 */
export function DraggableTable({ rows, headers, columnWidths, onRowsReorder, onColumnsReorder, renderCell }: DraggableTableProps) {
  const { rowOrder, columnOrder, dragging, getRowHandleProps, getColHandleProps } = useDraggable({
    rowCount: rows.length,
    columnCount: rows[0]?.cells.length ?? 0,
    onRowsReorder,
    onColumnsReorder,
  })

  // Pass original rows so prepare() only reruns when data changes, not on reorder.
  const rowHeights = useMeasure(rows, columnWidths, {
    lineHeight: LINE_HEIGHT,
    cellPadding: CELL_PADDING,
  })

  // Track the visual drop targets separately for highlight rendering.
  const [dropTarget, setDropTarget] = useState<number | null>(null)
  const [colDropTarget, setColDropTarget] = useState<number | null>(null)

  return (
    <div className="draggable-table-container">
      <table
        className="draggable-table"
        style={
          {
            '--draggable-table-font': BODY_FONT,
            '--draggable-table-header-font': HEADER_FONT,
          } as React.CSSProperties
        }
      >
        <thead>
          <tr>
            {/* Grip column header */}
            <th style={{ width: 32, maxWidth: 32 }} />
            {columnOrder.map((dataColIndex, visualColIndex) => {
              const colHandleProps = getColHandleProps(visualColIndex)
              const isColDragging = dragging?.type === 'column' && dragging.index === visualColIndex
              const isColDropTarget = colDropTarget === visualColIndex
              return (
                <th
                  key={dataColIndex}
                  style={{ width: columnWidths[dataColIndex], maxWidth: columnWidths[dataColIndex] }}
                  className={[isColDragging ? 'col-is-dragging' : '', isColDropTarget ? 'col-is-drop-target' : ''].filter(Boolean).join(' ') || undefined}
                  {...colHandleProps}
                  onDragEnter={(e) => {
                    setColDropTarget(visualColIndex)
                    colHandleProps.onDragEnter?.(e as React.DragEvent<HTMLElement>)
                  }}
                  onDragEnd={(e) => {
                    setColDropTarget(null)
                    colHandleProps.onDragEnd?.(e as React.DragEvent<HTMLElement>)
                  }}
                  onDrop={(e) => {
                    setColDropTarget(null)
                    colHandleProps.onDrop?.(e as React.DragEvent<HTMLElement>)
                  }}
                >
                  <span className="draggable-table-grip" tabIndex={0} role="button" aria-label="Drag to move this column" title="Drag to move this column">⠿</span>
                  <span className="draggable-table-header-text">{headers[dataColIndex]}</span>
                </th>
              )
            })}
          </tr>
        </thead>
        <tbody>
          {rowOrder.map((dataIndex, visualIndex) => {
            const row = rows[dataIndex]!
            const isDragging = dragging?.type === 'row' && dragging.index === visualIndex
            const isDropTarget = dropTarget === visualIndex

            const handleProps = getRowHandleProps(visualIndex)

            return (
              <tr
                key={row.id}
                style={{ height: rowHeights[dataIndex] }}
                className={[isDragging ? 'is-dragging' : '', isDropTarget ? 'is-drop-target' : '']
                  .filter(Boolean)
                  .join(' ') || undefined}
                {...handleProps}
                onDragEnter={(e) => {
                  setDropTarget(visualIndex)
                  handleProps.onDragEnter?.(e as React.DragEvent<HTMLElement>)
                }}
                onDragEnd={(e) => {
                  setDropTarget(null)
                  handleProps.onDragEnd?.(e as React.DragEvent<HTMLElement>)
                }}
                onDrop={(e) => {
                  setDropTarget(null)
                  handleProps.onDrop?.(e as React.DragEvent<HTMLElement>)
                }}
              >
                <td style={{ width: 32, maxWidth: 32 }}>
                  <span className="draggable-table-grip" tabIndex={0} role="button" aria-label="Drag to move this row" title="Drag to move this row">
                    ⠿
                  </span>
                </td>
                {columnOrder.map((dataColIndex) => (
                  <td
                    key={dataColIndex}
                    style={{ width: columnWidths[dataColIndex], maxWidth: columnWidths[dataColIndex] }}
                  >
                    {renderCell ? renderCell(row.cells[dataColIndex]!, dataIndex, dataColIndex) : row.cells[dataColIndex]}
                  </td>
                ))}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
