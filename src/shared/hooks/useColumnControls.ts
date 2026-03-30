import { useState, useMemo, useCallback } from 'react'

export interface UseColumnControlsOptions {
  /** Total number of columns. */
  columnCount: number
  /** Columns initially hidden (by index). Defaults to none. */
  initialHidden?: number[]
}

export interface UseColumnControlsResult {
  /** Boolean per column — true if visible. */
  visibility: boolean[]
  /** Indices of currently visible columns. */
  visibleIndices: number[]
  /** Toggle a column. Prevents hiding the last visible column. */
  toggleColumn: (colIndex: number) => void
  /** True when the column is the only one visible (cannot be hidden). */
  isLastVisible: (colIndex: number) => boolean
}

/**
 * Manages column visibility state for a table.
 *
 * Enforces a minimum of 1 visible column — toggling the last visible column
 * is a no-op.
 */
export function useColumnControls({
  columnCount,
  initialHidden = [],
}: UseColumnControlsOptions): UseColumnControlsResult {
  const [hiddenSet, setHiddenSet] = useState<Set<number>>(
    () => new Set(initialHidden.filter((i) => i >= 0 && i < columnCount))
  )

  const visibility = useMemo(() => {
    return Array.from({ length: columnCount }, (_, i) => !hiddenSet.has(i))
  }, [hiddenSet, columnCount])

  const visibleIndices = useMemo(() => {
    return visibility.reduce<number[]>((acc, v, i) => {
      if (v) acc.push(i)
      return acc
    }, [])
  }, [visibility])

  const visibleCount = visibleIndices.length

  const isLastVisible = useCallback(
    (colIndex: number) => visibility[colIndex] === true && visibleCount === 1,
    [visibility, visibleCount]
  )

  const toggleColumn = useCallback(
    (colIndex: number) => {
      setHiddenSet((prev) => {
        const isCurrentlyHidden = prev.has(colIndex)
        // If showing a column, always allow
        if (isCurrentlyHidden) {
          const next = new Set(prev)
          next.delete(colIndex)
          return next
        }
        // If hiding, check we won't go below 1 visible
        const currentVisible = columnCount - prev.size
        if (currentVisible <= 1) return prev
        const next = new Set(prev)
        next.add(colIndex)
        return next
      })
    },
    [columnCount]
  )

  return { visibility, visibleIndices, toggleColumn, isLastVisible }
}
