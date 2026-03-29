import { useMemo } from 'react'

export interface UseVirtualizationOptions {
  rowHeights: number[]
  /** Current scroll position of the viewport in px. Managed by the consumer. */
  scrollTop: number
  viewportHeight: number
  overscan?: number
}

export interface UseVirtualizationResult {
  /** Index of the first row to render (inclusive). */
  startIndex: number
  /** Index of the last row to render (inclusive). -1 when there are no rows. */
  endIndex: number
  /** Sum of all row heights — use as the height of the inner spacer div. */
  totalHeight: number
  /**
   * Cumulative top offset for each row.
   * offsets[i] = sum of rowHeights[0..i-1].
   * Use offsets[rowIndex] as the CSS `top` for each absolutely-positioned row.
   */
  offsets: number[]
}

/**
 * Computes the cumulative top offset for each row.
 * offsets[0] is always 0; offsets[i] = sum(rowHeights[0..i-1]).
 */
export function computeOffsets(rowHeights: number[]): number[] {
  const offsets = new Array<number>(rowHeights.length)
  let acc = 0
  for (let i = 0; i < rowHeights.length; i++) {
    offsets[i] = acc
    acc += rowHeights[i] ?? 0
  }
  return offsets
}

/** Returns the sum of all row heights (total scrollable content height). */
export function computeTotalHeight(rowHeights: number[]): number {
  let total = 0
  for (const h of rowHeights) total += h
  return total
}

/**
 * Binary search: returns the index of the first element in a sorted array
 * where arr[i] >= value. Returns arr.length when all elements are < value.
 */
function lowerBound(arr: number[], value: number): number {
  let lo = 0
  let hi = arr.length
  while (lo < hi) {
    const mid = (lo + hi) >>> 1
    if ((arr[mid] ?? 0) < value) lo = mid + 1
    else hi = mid
  }
  return lo
}

/**
 * Given precomputed offsets and rowHeights, computes the slice of rows that
 * should be rendered for the given scrollTop + viewportHeight window.
 *
 * The result is expanded by `overscan` rows above and below the visible range
 * to reduce blank flashes during fast scrolling.
 */
export function computeVirtualWindow(
  offsets: number[],
  rowHeights: number[],
  scrollTop: number,
  viewportHeight: number,
  overscan: number,
): { startIndex: number; endIndex: number } {
  const count = rowHeights.length
  if (count === 0) return { startIndex: 0, endIndex: -1 }

  // First row: the row whose top is just before scrollTop may be partially visible.
  const idx = lowerBound(offsets, scrollTop)
  const firstVisible = Math.max(idx - 1, 0)
  const startIndex = Math.max(firstVisible - overscan, 0)

  // Last row: the last row whose top falls before the viewport bottom edge.
  const bottomEdge = scrollTop + viewportHeight
  const idx2 = lowerBound(offsets, bottomEdge)
  const lastVisible = Math.min(Math.max(idx2 - 1, 0), count - 1)
  const endIndex = Math.min(lastVisible + overscan, count - 1)

  return { startIndex, endIndex }
}

/**
 * Computes the virtual window (which rows to render) from pretext-measured
 * row heights and the current scroll position. No internal scroll state —
 * pass `scrollTop` from your own `useState` and update it with `onScroll`.
 */
export function useVirtualization(options: UseVirtualizationOptions): UseVirtualizationResult {
  const { rowHeights, scrollTop, viewportHeight, overscan = 3 } = options

  const offsets = useMemo(() => computeOffsets(rowHeights), [rowHeights])
  const totalHeight = useMemo(() => computeTotalHeight(rowHeights), [rowHeights])

  const { startIndex, endIndex } = useMemo(
    () => computeVirtualWindow(offsets, rowHeights, scrollTop, viewportHeight, overscan),
    [offsets, rowHeights, scrollTop, viewportHeight, overscan],
  )

  return { startIndex, endIndex, totalHeight, offsets }
}
