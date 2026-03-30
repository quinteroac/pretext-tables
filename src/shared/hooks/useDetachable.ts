import { useState, useCallback } from 'react'
import type { Row } from '../types.js'

export interface UseDetachableOptions {
  /** Returns the child rows for a given parent row. */
  getChildRows: (row: Row) => Row[]
}

export interface UseDetachableResult {
  /** Set of row IDs that are currently expanded. */
  expandedRows: Set<string>
  /** Toggle expand/collapse state for a given row ID. */
  toggle: (rowId: string) => void
  /** Returns the child rows for a given parent row (pass-through from options). */
  getChildRows: (row: Row) => Row[]
}

/**
 * Pure utility: adds or removes `id` from `set` and returns a new Set.
 * Extracted so the toggle logic can be unit-tested without a React renderer.
 */
export function toggleSet(set: Set<string>, id: string): Set<string> {
  const next = new Set(set)
  if (next.has(id)) {
    next.delete(id)
  } else {
    next.add(id)
  }
  return next
}

/**
 * Manages expand/collapse state for rows that open an inline child table.
 *
 * Each parent row expands into a child data panel. The parent and child tables
 * each own independent `useMeasure` instances — no shared or recursive
 * measurement.
 *
 * Usage:
 *   const { expandedRows, toggle, getChildRows } = useDetachable({ getChildRows })
 *   // In the parent row: onClick={() => toggle(row.id)}
 *   // When expanded:     <ChildPanel rows={getChildRows(row)} />
 */
export function useDetachable(options: UseDetachableOptions): UseDetachableResult {
  const { getChildRows } = options
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())

  const toggle = useCallback((rowId: string) => {
    setExpandedRows((prev) => toggleSet(prev, rowId))
  }, [])

  return { expandedRows, toggle, getChildRows }
}
