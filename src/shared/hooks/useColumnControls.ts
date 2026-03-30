import { useState, useMemo, useCallback } from 'react'

/** Column definition passed to useColumnControls. */
export interface UseColumnControlsOptions {
  id: string
  label: string
  /** Defaults to true when omitted. */
  defaultVisible?: boolean
  sticky?: boolean
}

/** Column state returned in visibleColumns / allColumns. */
export interface ColumnState extends Required<UseColumnControlsOptions> {
  visible: boolean
}

export type ColumnSortDirection = 'asc' | 'desc'

export interface UseColumnControlsResult {
  /** Only the currently-visible columns, in definition order. */
  visibleColumns: ColumnState[]
  /** All columns (visible and hidden), in definition order. */
  allColumns: ColumnState[]
  /** id of the column currently sorted on, or null. */
  sortKey: string | null
  /** Current sort direction, or null when no sort is active. */
  sortDirection: ColumnSortDirection | null
  /**
   * Toggle a column's visibility.
   * Prevents hiding the last visible column (no-op in that case).
   */
  toggleColumnVisibility: (id: string) => void
  /**
   * Set sort on a column.
   * Cycling: none → asc → desc → none (same column each call).
   * A different id always resets to asc.
   */
  setSort: (id: string) => void
  /** Clear sort state. */
  resetSort: () => void
}

/**
 * Manages column visibility and sort state for any table.
 *
 * Does not import or call prepare() / layout() — purely UI state.
 */
export function useColumnControls(columns: UseColumnControlsOptions[]): UseColumnControlsResult {
  const [hiddenIds, setHiddenIds] = useState<Set<string>>(() => {
    const s = new Set<string>()
    for (const col of columns) {
      if (col.defaultVisible === false) s.add(col.id)
    }
    return s
  })

  const [sortState, setSortState] = useState<{
    key: string | null
    direction: ColumnSortDirection | null
  }>({ key: null, direction: null })

  const allColumns = useMemo<ColumnState[]>(
    () =>
      columns.map((col) => ({
        id: col.id,
        label: col.label,
        defaultVisible: col.defaultVisible ?? true,
        sticky: col.sticky ?? false,
        visible: !hiddenIds.has(col.id),
      })),
    [columns, hiddenIds]
  )

  const visibleColumns = useMemo(() => allColumns.filter((c) => c.visible), [allColumns])

  const toggleColumnVisibility = useCallback(
    (id: string) => {
      setHiddenIds((prev) => {
        if (prev.has(id)) {
          // Show the column
          const next = new Set(prev)
          next.delete(id)
          return next
        }
        // Hide — enforce minimum 1 visible
        const currentVisible = columns.length - prev.size
        if (currentVisible <= 1) return prev
        const next = new Set(prev)
        next.add(id)
        return next
      })
    },
    [columns.length]
  )

  const setSort = useCallback((id: string) => {
    setSortState((prev) => {
      if (prev.key !== id) return { key: id, direction: 'asc' }
      if (prev.direction === 'asc') return { key: id, direction: 'desc' }
      // desc → reset
      return { key: null, direction: null }
    })
  }, [])

  const resetSort = useCallback(() => {
    setSortState({ key: null, direction: null })
  }, [])

  return {
    visibleColumns,
    allColumns,
    sortKey: sortState.key,
    sortDirection: sortState.direction,
    toggleColumnVisibility,
    setSort,
    resetSort,
  }
}
