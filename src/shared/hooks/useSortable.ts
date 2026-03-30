import { useState, useMemo, useCallback } from 'react'
import type { Row } from '../types.js'

export type SortDirection = 'asc' | 'desc' | 'none'

export interface SortState {
  column: number | null
  direction: SortDirection
}

/**
 * Advances the sort state when a column header is clicked.
 *
 * Same column: none → asc → desc → none
 * Different column: resets to asc on the new column
 */
export function nextSortState(current: SortState, clickedColumn: number): SortState {
  if (current.column !== clickedColumn) {
    return { column: clickedColumn, direction: 'asc' }
  }
  if (current.direction === 'asc') {
    return { column: clickedColumn, direction: 'desc' }
  }
  if (current.direction === 'desc') {
    return { column: null, direction: 'none' }
  }
  // direction === 'none'
  return { column: clickedColumn, direction: 'asc' }
}

/**
 * Sorts rows by the given column using locale-aware string comparison.
 * Returns the original array reference when direction is 'none'.
 */
export function sortRows(rows: Row[], state: SortState): Row[] {
  if (state.direction === 'none' || state.column === null) return rows
  const col = state.column
  const dir = state.direction === 'asc' ? 1 : -1
  return [...rows].sort((a, b) => dir * a.cells[col].localeCompare(b.cells[col]))
}

export interface UseSortableResult {
  sortState: SortState
  sortedRows: Row[]
  onHeaderClick: (columnIndex: number) => void
}

/**
 * Manages column sort state and produces a sorted row array.
 *
 * The sorted array is memoised so that downstream hooks (useMeasure)
 * only re-run when the sort actually changes.
 */
export function useSortable(rows: Row[]): UseSortableResult {
  const [sortState, setSortState] = useState<SortState>({ column: null, direction: 'none' })

  const onHeaderClick = useCallback((columnIndex: number) => {
    setSortState((prev) => nextSortState(prev, columnIndex))
  }, [])

  const sortedRows = useMemo(() => sortRows(rows, sortState), [rows, sortState])

  return { sortState, sortedRows, onHeaderClick }
}
