import { useMemo } from 'react'

export interface UseVirtualizationOptions {
  rowHeights: number[]
  scrollTop: number
  viewportHeight: number
  overscan?: number
}

export interface UseVirtualizationResult {
  startIndex: number
  endIndex: number       // -1 when there are no rows
  totalHeight: number    // use as the height of the inner spacer div
  offsets: number[]      // offsets[i] = sum(rowHeights[0..i-1]), use as CSS top
}

/** offsets[0] = 0; offsets[i] = sum of all heights before row i. */
export function computeOffsets(rowHeights: number[]): number[] {
  const offsets = new Array<number>(rowHeights.length)
  let acc = 0
  for (let i = 0; i < rowHeights.length; i++) {
    offsets[i] = acc
    acc += rowHeights[i] ?? 0
  }
  return offsets
}

export function computeTotalHeight(rowHeights: number[]): number {
  return rowHeights.reduce((s, h) => s + h, 0)
}

/**
 * Computes which rows fall inside the current scroll viewport.
 * Expands by `overscan` rows above and below to reduce blank flashes.
 */
export function useVirtualization(options: UseVirtualizationOptions): UseVirtualizationResult {
  const { rowHeights, scrollTop, viewportHeight, overscan = 3 } = options

  const offsets = useMemo(() => computeOffsets(rowHeights), [rowHeights])
  const totalHeight = useMemo(() => computeTotalHeight(rowHeights), [rowHeights])

  const { startIndex, endIndex } = useMemo(() => {
    const count = rowHeights.length
    if (count === 0) return { startIndex: 0, endIndex: -1 }

    // Binary search for the first row at/after scrollTop
    let lo = 0, hi = offsets.length
    while (lo < hi) {
      const mid = (lo + hi) >>> 1
      if ((offsets[mid] ?? 0) < scrollTop) lo = mid + 1; else hi = mid
    }
    const startIndex = Math.max(lo - 1 - overscan, 0)

    const bottom = scrollTop + viewportHeight
    lo = 0; hi = offsets.length
    while (lo < hi) {
      const mid = (lo + hi) >>> 1
      if ((offsets[mid] ?? 0) < bottom) lo = mid + 1; else hi = mid
    }
    const endIndex = Math.min(lo - 1 + overscan, count - 1)

    return { startIndex, endIndex }
  }, [offsets, rowHeights, scrollTop, viewportHeight, overscan])

  return { startIndex, endIndex, totalHeight, offsets }
}
