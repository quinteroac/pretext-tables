import { useCallback } from 'react'
import { walkLineRanges } from '@chenglou/pretext'
import type { PreparedTextWithSegments } from '@chenglou/pretext'

export interface UseShrinkWrapOptions {
  /** Total horizontal cell padding in px (left + right). Default 16. */
  cellPadding?: number
  /** Absolute minimum column width returned, in px. Default 20. */
  minWidth?: number
  /** Upper search bound in px. Default 2000. */
  maxWidth?: number
}

export interface UseShrinkWrapResult {
  /**
   * Returns the minimum column pixel width (including padding) where no cell
   * in `colIndex` wraps onto a second line.
   * Uses binary search over `walkLineRanges()` — zero DOM reads.
   */
  fitColumn: (colIndex: number) => number
}

// ---------------------------------------------------------------------------
// Pure helper (exported for testing)
// ---------------------------------------------------------------------------

/**
 * Returns the minimum column width (including `cellPadding`) at which every
 * cell in `cells` renders on a single line.  Binary search converges within
 * ±1 px of the true wrap boundary.
 */
export function shrinkWrapColumn(
  cells: PreparedTextWithSegments[],
  options?: UseShrinkWrapOptions
): number {
  const { cellPadding = 16, minWidth = 20, maxWidth = 2000 } = options ?? {}

  const minInner = Math.max(minWidth - cellPadding, 1)
  const maxInner = Math.max(maxWidth - cellPadding, minInner)

  let widest = 0
  for (const cell of cells) {
    const w = findMinInnerWidth(cell, minInner, maxInner)
    if (w > widest) widest = w
  }

  return Math.max(widest + cellPadding, minWidth)
}

/**
 * Binary-search the smallest inner width (px) at which `prepared` renders in
 * ≤1 line.  Invariant: lo → wraps (>1 line), hi → fits (≤1 line).
 */
function findMinInnerWidth(
  prepared: PreparedTextWithSegments,
  lo: number,
  hi: number
): number {
  const countAt = (w: number) => walkLineRanges(prepared, w, _noop)

  // Empty / whitespace-only cell has no content lines — return minimum.
  if (countAt(hi) === 0) return lo

  // Already single-line at lo — nothing to search.
  if (countAt(lo) <= 1) return lo

  // Still wraps at hi (e.g., unbreakable content wider than maxWidth).
  if (countAt(hi) > 1) return hi

  // Binary search: converges when hi - lo ≤ 1, giving ±1 px accuracy.
  while (hi - lo > 1) {
    const mid = Math.floor((lo + hi) / 2)
    if (countAt(mid) <= 1) {
      hi = mid
    } else {
      lo = mid
    }
  }

  return hi
}

function _noop() {}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * `useShrinkWrap` — binary-search minimum column width via `walkLineRanges`.
 *
 * Pass the `prepared` grid produced by your `useMemo` + `prepareWithSegments`
 * call (or `null` while fonts are loading). `columnWidths` is used only as a
 * fallback while `prepared` is null.
 *
 * @example
 * const { fitColumn } = useShrinkWrap(prepared, columnWidths)
 * // Snap column 1 to its tightest wrap-free width:
 * setColumnWidths(ws => ws.map((w, i) => i === 1 ? fitColumn(1) : w))
 */
export function useShrinkWrap(
  prepared: PreparedTextWithSegments[][] | null,
  columnWidths: number[],
  options?: UseShrinkWrapOptions
): UseShrinkWrapResult {
  const cellPadding = options?.cellPadding ?? 16
  const minWidth = options?.minWidth ?? 20
  const maxWidth = options?.maxWidth ?? 2000

  const fitColumn = useCallback(
    (colIndex: number): number => {
      if (!prepared || prepared.length === 0) return columnWidths[colIndex] ?? minWidth

      const cells = prepared
        .map((row) => row[colIndex])
        .filter((c): c is PreparedTextWithSegments => c != null)

      if (cells.length === 0) return minWidth

      return shrinkWrapColumn(cells, { cellPadding, minWidth, maxWidth })
    },
    [prepared, columnWidths, cellPadding, minWidth, maxWidth]
  )

  return { fitColumn }
}
