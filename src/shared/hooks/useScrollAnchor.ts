import { useCallback, useLayoutEffect, useRef } from 'react'
import type { Row } from '../types.js'

export interface UseScrollAnchorOptions {
  /** Unused at runtime — reserved for future per-row default height overrides. */
  _reserved?: never
}

export interface UseScrollAnchorResult {
  /**
   * Register a prepend intent, then synchronously update your rows state.
   * The hook adjusts `scrollTop` after React flushes, before the browser paints.
   *
   * @param newRows  The rows about to be inserted.
   * @param atIndex  Insertion index in the (post-insert) rows array. Defaults to 0.
   */
  prepend: (newRows: Row[], atIndex?: number) => void
}

type PendingPrepend = { count: number; atIndex: number }

/**
 * Computes the scroll delta required to keep the anchor row visible when
 * `insertedCount` rows are inserted starting at `atIndex`.
 *
 * Uses pretext-computed `rowHeights[]` — no `getBoundingClientRect`,
 * no `scrollHeight`, no DOM reads.
 *
 * @param rowHeights    The full, updated heights array (post-insert).
 * @param insertedCount Number of newly inserted rows.
 * @param atIndex       Index of the first inserted row in the updated array.
 */
export function computeScrollDelta(
  rowHeights: number[],
  insertedCount: number,
  atIndex: number,
): number {
  let delta = 0
  const end = atIndex + insertedCount
  for (let i = atIndex; i < end && i < rowHeights.length; i++) {
    delta += rowHeights[i]!
  }
  return delta
}

/**
 * Corrects `scrollTop` after prepending rows so the currently visible
 * content does not jump.
 *
 * **Usage pattern**
 * ```ts
 * const { prepend } = useScrollAnchor(rowHeights, scrollRef)
 *
 * function handleIncoming(newRows: Row[]) {
 *   prepend(newRows)                             // 1. register intent
 *   setRows(prev => [...newRows, ...prev])       // 2. update state immediately after
 * }
 * ```
 *
 * The hook reads the updated `rowHeights[]` (from `useMeasure`) in a
 * `useLayoutEffect` and applies the correction synchronously — no browser
 * paint occurs between rows appearing and the scroll offset being fixed.
 */
export function useScrollAnchor(
  rowHeights: number[],
  scrollRef: React.RefObject<HTMLElement | null>,
  _options?: UseScrollAnchorOptions,
): UseScrollAnchorResult {
  const pendingRef = useRef<PendingPrepend | null>(null)

  useLayoutEffect(() => {
    const pending = pendingRef.current
    if (!pending) return

    const el = scrollRef.current
    if (!el) {
      pendingRef.current = null
      return
    }

    // rowHeights now includes the prepended rows at [atIndex..atIndex+count].
    // Sum their heights to compute how far the content shifted.
    const delta = computeScrollDelta(rowHeights, pending.count, pending.atIndex)
    el.scrollTop += delta
    pendingRef.current = null
  })

  const prepend = useCallback((newRows: Row[], atIndex = 0) => {
    pendingRef.current = { count: newRows.length, atIndex }
  }, [])

  return { prepend }
}
