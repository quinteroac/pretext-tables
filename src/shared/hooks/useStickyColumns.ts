import { useMemo } from 'react'

export interface UseStickyColumnsOptions {
  /** Number of columns to freeze on the left. */
  frozenCount: number
  /** Full ordered list of column widths in px. */
  columnWidths: number[]
}

export interface UseStickyColumnsResult {
  /** Widths of the frozen (left-pinned) columns. Length === frozenCount. */
  frozenWidths: number[]
  /**
   * Widths of the scrollable (right) columns.
   * `frozenWidths.concat(scrollWidths)` equals the original `columnWidths`.
   */
  scrollWidths: number[]
}

/**
 * Pure helper: slices `columnWidths` at `frozenCount`.
 * Exported so callers can test the logic without React.
 */
export function sliceStickyColumns(
  columnWidths: number[],
  frozenCount: number,
): UseStickyColumnsResult {
  return {
    frozenWidths: columnWidths.slice(0, frozenCount),
    scrollWidths: columnWidths.slice(frozenCount),
  }
}

/**
 * Slices `columnWidths` into a frozen pane and a scrollable pane.
 *
 * Pass `frozenWidths.concat(scrollWidths)` as the single `columnWidths`
 * argument to `useMeasure` so both panes share one `rowHeights[]` array and
 * stay height-synchronised without any DOM measurement.
 *
 * Changing `frozenCount` at runtime re-slices the arrays without triggering
 * a new `prepare()` call — only `layout()` (cheap arithmetic) reruns.
 */
export function useStickyColumns({
  frozenCount,
  columnWidths,
}: UseStickyColumnsOptions): UseStickyColumnsResult {
  return useMemo(
    () => sliceStickyColumns(columnWidths, frozenCount),
    [columnWidths, frozenCount],
  )
}
