import { useMemo } from 'react'
import { layout } from '@chenglou/pretext'
import type { PreparedTextWithSegments } from '@chenglou/pretext'

export interface ResizePreviewDragState {
  /** Index of the column currently being dragged. */
  colIndex: number
  /** Live preview width of that column — updates on every pointer move. */
  currentWidth: number
}

export interface UseResizePreviewOptions {
  /** Line height in px. Default 20. */
  lineHeight?: number
  /**
   * Total horizontal cell padding in px (left + right).
   * Subtracted from each column width before layout(). Default 16.
   */
  cellPadding?: number
  /**
   * Committed column widths used for all non-dragged columns.
   * Typically the `columnWidths` from `useResizable`.
   */
  columnWidths?: number[]
}

export interface UseResizePreviewResult {
  /**
   * One height per row, computed with the dragged column at its current preview
   * width and all other columns at their committed widths.
   * `null` when no drag is active or `prepared` is not yet available.
   */
  previewHeights: number[] | null
}

// ---------------------------------------------------------------------------
// Pure helper — exported for unit tests
// ---------------------------------------------------------------------------

/**
 * Computes preview row heights during a column-resize drag using `layout()`
 * from `@chenglou/pretext`. No DOM reads.
 *
 * Performance: `layout()` is pure arithmetic. A full recompute over 200 rows
 * × 3 columns runs in well under 2 ms on modern hardware.
 *
 * @param prepared  Prepared text grid produced by `prepareWithSegments`.
 * @param dragState The column being dragged and its current preview width.
 * @param columnWidths  Committed widths for all columns (fallback: 100 px).
 * @param lineHeight    Line height in px (default 20).
 * @param cellPadding   Total horizontal padding subtracted before layout (default 16).
 */
export function computePreviewHeights(
  prepared: PreparedTextWithSegments[][],
  dragState: ResizePreviewDragState,
  columnWidths: number[],
  lineHeight: number,
  cellPadding: number,
): number[] {
  const { colIndex: draggedCol, currentWidth } = dragState

  return prepared.map((preparedCells) => {
    let maxHeight = lineHeight
    for (let col = 0; col < preparedCells.length; col++) {
      const colWidth = col === draggedCol ? currentWidth : (columnWidths[col] ?? 100)
      const innerWidth = Math.max(colWidth - cellPadding, 1)
      const h = layout(preparedCells[col], innerWidth, lineHeight).height
      if (h > maxHeight) maxHeight = h
    }
    return maxHeight
  })
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * Returns ghost row heights during a column-resize drag — no DOM reads.
 *
 * Uses `layout()` from `@chenglou/pretext` to recompute heights for the
 * dragged column on every pointer-move event.  The real table heights (from
 * `useMeasure`) are unaffected; this result is only for a ghost/preview layer.
 *
 * Returns `null` when `dragState` is `null` (no drag active) or when
 * `prepared` has not yet been produced (fonts not ready).
 *
 * @example
 * const { previewDragState } = useResizable({ defaultColumnWidths, horizontal: true })
 * const { previewHeights }   = useResizePreview(prepared, previewDragState, {
 *   columnWidths,
 *   lineHeight: LINE_HEIGHT,
 *   cellPadding: CELL_PADDING,
 * })
 * // Render a ghost overlay using previewHeights when it is non-null.
 */
export function useResizePreview(
  prepared: PreparedTextWithSegments[][] | null,
  dragState: ResizePreviewDragState | null,
  options?: UseResizePreviewOptions,
): UseResizePreviewResult {
  const { lineHeight = 20, cellPadding = 16, columnWidths = [] } = options ?? {}

  const previewHeights = useMemo<number[] | null>(() => {
    if (prepared === null || dragState === null) return null
    return computePreviewHeights(prepared, dragState, columnWidths, lineHeight, cellPadding)
  }, [prepared, dragState, lineHeight, cellPadding, columnWidths])

  return { previewHeights }
}
