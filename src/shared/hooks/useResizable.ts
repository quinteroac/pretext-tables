import { useState, useRef, useEffect } from 'react'
import type React from 'react'
import type { ResizePreviewDragState } from './useResizePreview.js'

export interface ResizableOptions {
  /** Initial column widths in px. */
  defaultColumnWidths: number[]
  /** Minimum column width in px. Default 60. */
  minColumnWidth?: number
  /**
   * Enable horizontal column-resize drag handles.
   * A handle appears at the right edge of every non-last header cell.
   * Default true.
   */
  horizontal?: boolean

  /** Number of rows (needed to initialise the row-height override array). */
  rowCount?: number
  /** Minimum row height in px when vertical resize is active. Default 24. */
  minRowHeight?: number
  /**
   * Enable vertical row-resize drag handles.
   * A handle appears at the bottom edge of the last cell in each row.
   * Default false.
   */
  vertical?: boolean
}

export interface ResizableResult {
  columnWidths: number[]
  /** Imperatively override column widths (e.g. when the container scales). */
  setColumnWidths: React.Dispatch<React.SetStateAction<number[]>>

  /**
   * Sparse array of user-dragged row heights. An entry is undefined when the
   * row has not been manually resized (use your computed height instead).
   */
  manualRowHeights: (number | undefined)[]

  /** Props to spread onto the column-resize handle element. */
  getColHandleProps: (colIndex: number) => React.HTMLAttributes<HTMLSpanElement>

  /**
   * Props to spread onto the row-resize handle element.
   * Pass the current display height of the row so the drag starts from the
   * right baseline (pretext-computed or previously overridden).
   */
  getRowHandleProps: (
    rowIndex: number,
    currentHeight: number
  ) => React.HTMLAttributes<HTMLSpanElement>

  /**
   * The column currently being dragged and its live preview width.
   * `null` when no horizontal drag is in progress.
   * Pass this directly to `useResizePreview` to compute ghost row heights.
   */
  previewDragState: ResizePreviewDragState | null
}

/**
 * Manages interactive column and row resizing for a table.
 *
 * - horizontal: drag handles between column headers resize column widths
 * - vertical:   drag handles at the bottom of each row override row heights
 */
export function useResizable(options: ResizableOptions): ResizableResult {
  const {
    defaultColumnWidths,
    minColumnWidth = 60,
    horizontal = true,
    rowCount = 0,
    minRowHeight = 24,
    vertical = false,
  } = options

  const [columnWidths, setColumnWidths] = useState<number[]>(defaultColumnWidths)
  const [manualRowHeights, setManualRowHeights] = useState<(number | undefined)[]>(() =>
    Array(rowCount).fill(undefined)
  )
  const [previewDragState, setPreviewDragState] = useState<ResizePreviewDragState | null>(null)

  const colDrag = useRef<{ colIndex: number; startX: number; startWidth: number } | null>(null)
  const rowDrag = useRef<{ rowIndex: number; startY: number; startHeight: number } | null>(null)

  useEffect(() => {
    if (!horizontal && !vertical) return

    function onMouseMove(e: MouseEvent) {
      if (horizontal && colDrag.current) {
        const { colIndex, startX, startWidth } = colDrag.current
        const delta = e.clientX - startX
        const newWidth = Math.max(startWidth + delta, minColumnWidth)
        setPreviewDragState({ colIndex, currentWidth: newWidth })
        setColumnWidths((prev) => {
          const next = [...prev]
          next[colIndex] = newWidth
          return next
        })
      }
      if (vertical && rowDrag.current) {
        const { rowIndex, startY, startHeight } = rowDrag.current
        const delta = e.clientY - startY
        setManualRowHeights((prev) => {
          const next = [...prev]
          next[rowIndex] = Math.max(startHeight + delta, minRowHeight)
          return next
        })
      }
    }

    function onMouseUp() {
      setPreviewDragState(null)
      colDrag.current = null
      rowDrag.current = null
    }

    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
    return () => {
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
    }
  }, [horizontal, vertical, minColumnWidth, minRowHeight])

  function getColHandleProps(colIndex: number): React.HTMLAttributes<HTMLSpanElement> {
    if (!horizontal) return {}
    return {
      onMouseDown(e) {
        e.preventDefault()
        colDrag.current = { colIndex, startX: e.clientX, startWidth: columnWidths[colIndex] }
      },
    }
  }

  function getRowHandleProps(
    rowIndex: number,
    currentHeight: number
  ): React.HTMLAttributes<HTMLSpanElement> {
    if (!vertical) return {}
    return {
      onMouseDown(e) {
        e.preventDefault()
        rowDrag.current = { rowIndex, startY: e.clientY, startHeight: currentHeight }
      },
    }
  }

  return {
    columnWidths,
    setColumnWidths,
    manualRowHeights,
    getColHandleProps,
    getRowHandleProps,
    previewDragState,
  }
}
