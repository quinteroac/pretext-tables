import { useState, useCallback, useRef, useEffect } from 'react'
import type { Row } from '../types.js'

export interface UseInfiniteScrollOptions {
  /**
   * Called when the scroll container nears the bottom.
   * Must return a Promise<Row[]> — the resolved rows are the new batch to append.
   *
   * The hook is a **pure event/flag primitive** — it does not manage row state.
   * After the Promise resolves, the caller is responsible for appending the new rows
   * to its own React state. `useMeasure` will compute their heights in the same
   * render cycle before the browser paints, preventing scroll-position jumps.
   */
  onLoadMore: () => Promise<Row[]>
  /**
   * Distance in px from the bottom of the scroll container that triggers a load.
   * Default: 200.
   */
  threshold?: number
  /**
   * Pretext-computed row heights from `useMeasure()`.
   *
   * **Why this is required:** The hook must detect proximity to the bottom without
   * reading `scrollHeight` from the DOM (which would be a layout-forcing DOM read).
   * Instead, total content height is derived by summing `rowHeights` — the same
   * values that `useMeasure` computes via `@chenglou/pretext` before any render.
   *
   * Canonical wiring:
   * ```ts
   * const { rowHeights } = useMeasure(rows, columnWidths)
   * const { onScroll, isLoading } = useInfiniteScroll({ onLoadMore, rowHeights })
   * ```
   */
  rowHeights: number[]
}

export interface UseInfiniteScrollResult {
  /**
   * Attach to the scroll container's `onScroll` prop.
   * Reads only `scrollTop` and `clientHeight` from the DOM event target.
   */
  onScroll: (e: React.UIEvent<HTMLElement>) => void
  /**
   * `true` from the moment `onLoadMore` is called until its Promise resolves (or rejects).
   * While `true`, subsequent scroll events will not re-trigger `onLoadMore`.
   */
  isLoading: boolean
}

/**
 * Computes the distance (in px) between the current scroll position and the
 * bottom of the scrollable content, using pretext row heights instead of
 * `scrollHeight` (which would be a DOM read).
 *
 * @param scrollTop    Current scrollTop of the container.
 * @param clientHeight Visible height of the container.
 * @param rowHeights   Pretext-computed heights for all rows (from `useMeasure`).
 */
export function computeDistanceFromBottom(
  scrollTop: number,
  clientHeight: number,
  rowHeights: number[],
): number {
  const totalHeight = rowHeights.reduce((sum, h) => sum + h, 0)
  return totalHeight - scrollTop - clientHeight
}

/**
 * Triggers `onLoadMore` when the user scrolls within `threshold` px of the
 * bottom of the scroll container.
 *
 * **Composes with `useMeasure` and `useVirtualization`**
 * ```ts
 * const { rowHeights } = useMeasure(rows, columnWidths)
 * const { virtualRows, onScroll: onVScroll } = useVirtualization({ rowHeights, containerHeight })
 * const { onScroll, isLoading } = useInfiniteScroll({ onLoadMore, rowHeights })
 *
 * const handleScroll = (e) => { onVScroll(e); onScroll(e) }
 * ```
 *
 * **No DOM sizing** — only `scrollTop` and `clientHeight` are read from the
 * event target, solely to detect proximity to the bottom (AC07).
 * Total content height is derived from `rowHeights` (pretext data).
 *
 * **Pre-measurement** — because `onLoadMore` returns `Promise<Row[]>`, the
 * caller's `useMeasure(rows, columnWidths)` will have measured all existing
 * rows before the new batch is appended. When the consumer adds the resolved
 * rows to React state, `useMeasure` computes their heights in the same render
 * cycle — before the browser paints — so cells enter the DOM with explicit
 * heights already set (zero DOM reflow).
 */
export function useInfiniteScroll({
  onLoadMore,
  threshold = 200,
  rowHeights,
}: UseInfiniteScrollOptions): UseInfiniteScrollResult {
  const [isLoading, setIsLoading] = useState(false)

  // Ref-based loading flag prevents stale-closure reads inside onScroll.
  const isLoadingRef = useRef(false)

  // Keep mutable refs up-to-date on every render without rebuilding onScroll.
  const rowHeightsRef = useRef(rowHeights)
  useEffect(() => {
    rowHeightsRef.current = rowHeights
  }, [rowHeights])

  const onLoadMoreRef = useRef(onLoadMore)
  useEffect(() => {
    onLoadMoreRef.current = onLoadMore
  }, [onLoadMore])

  const thresholdRef = useRef(threshold)
  useEffect(() => {
    thresholdRef.current = threshold
  }, [threshold])

  const onScroll = useCallback((e: React.UIEvent<HTMLElement>) => {
    // AC05 — guard: do not trigger a second load while one is in flight.
    if (isLoadingRef.current) return

    // AC07 — read only scrollTop and clientHeight from the DOM.
    const { scrollTop, clientHeight } = e.currentTarget

    // AC07 — total height comes from pretext rowHeights, not DOM scrollHeight.
    const distance = computeDistanceFromBottom(scrollTop, clientHeight, rowHeightsRef.current)

    // AC02 — trigger when within threshold px of the bottom.
    if (distance < thresholdRef.current) {
      isLoadingRef.current = true
      setIsLoading(true)

      // AC03, AC04 — isLoading stays true until the Promise settles.
      Promise.resolve(onLoadMoreRef.current()).then(
        () => {
          isLoadingRef.current = false
          setIsLoading(false)
        },
        () => {
          isLoadingRef.current = false
          setIsLoading(false)
        },
      )
    }
  }, [])

  return { onScroll, isLoading }
}
