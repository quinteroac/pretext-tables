import { useState, useRef } from 'react'
import type React from 'react'

export interface UseDraggableOptions {
  rowCount: number
  columnCount: number
  onRowsReorder?: (newOrder: number[]) => void
  onColumnsReorder?: (newOrder: number[]) => void
}

export interface DraggableResult {
  rowOrder: number[]
  columnOrder: number[]
  dragging: { type: 'row' | 'column'; index: number } | null
  getRowHandleProps: (rowIndex: number) => React.HTMLAttributes<HTMLElement>
  getColHandleProps: (colIndex: number) => React.HTMLAttributes<HTMLElement>
}

/** Pure reorder helper — moves the item at `from` to position `to`. */
export function reorder(order: number[], from: number, to: number): number[] {
  const next = [...order]
  const [moved] = next.splice(from, 1)
  next.splice(to, 0, moved!)
  return next
}

/**
 * Manages drag-reorder state for rows and columns using native HTML5
 * drag-and-drop events. No DOM measurement APIs are used.
 */
export function useDraggable(options: UseDraggableOptions): DraggableResult {
  const { rowCount, columnCount, onRowsReorder, onColumnsReorder } = options

  const [rowOrder, setRowOrder] = useState<number[]>(() =>
    Array.from({ length: rowCount }, (_, i) => i)
  )
  const [columnOrder, setColumnOrder] = useState<number[]>(() =>
    Array.from({ length: columnCount }, (_, i) => i)
  )
  const [dragging, setDragging] = useState<{ type: 'row' | 'column'; index: number } | null>(null)

  // Records the visual index of the element where the drag started.
  const dragSourceRef = useRef<number | null>(null)
  // Tracks the visual index of the element currently being dragged over (for drop-target highlight).
  const dragOverIndex = useRef<number | null>(null)

  function getRowHandleProps(rowIndex: number): React.HTMLAttributes<HTMLElement> {
    return {
      draggable: true,
      onDragStart(e) {
        dragSourceRef.current = rowIndex
        setDragging({ type: 'row', index: rowIndex })
        e.dataTransfer.effectAllowed = 'move'
      },
      onDragEnter() {
        dragOverIndex.current = rowIndex
      },
      onDragOver(e) {
        e.preventDefault()
        e.dataTransfer.dropEffect = 'move'
      },
      onDrop(e) {
        e.preventDefault()
        const from = dragSourceRef.current  // the drag source
        const to = rowIndex                 // this element is the drop target
        if (from !== null && from !== to) {
          setRowOrder((prev) => {
            const next = reorder(prev, from, to)
            onRowsReorder?.(next)
            return next
          })
        }
        dragSourceRef.current = null
        dragOverIndex.current = null
        setDragging(null)
      },
      onDragEnd() {
        dragSourceRef.current = null
        dragOverIndex.current = null
        setDragging(null)
      },
    }
  }

  function getColHandleProps(colIndex: number): React.HTMLAttributes<HTMLElement> {
    return {
      draggable: true,
      onDragStart(e) {
        dragSourceRef.current = colIndex
        setDragging({ type: 'column', index: colIndex })
        e.dataTransfer.effectAllowed = 'move'
      },
      onDragEnter() {
        dragOverIndex.current = colIndex
      },
      onDragOver(e) {
        e.preventDefault()
        e.dataTransfer.dropEffect = 'move'
      },
      onDrop(e) {
        e.preventDefault()
        const from = dragSourceRef.current  // the drag source
        const to = colIndex                 // this element is the drop target
        if (from !== null && from !== to) {
          setColumnOrder((prev) => {
            const next = reorder(prev, from, to)
            onColumnsReorder?.(next)
            return next
          })
        }
        dragSourceRef.current = null
        dragOverIndex.current = null
        setDragging(null)
      },
      onDragEnd() {
        dragSourceRef.current = null
        dragOverIndex.current = null
        setDragging(null)
      },
    }
  }

  return { rowOrder, columnOrder, dragging, getRowHandleProps, getColHandleProps }
}
