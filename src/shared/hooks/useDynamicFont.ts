import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { prepareWithSegments, layout } from '@chenglou/pretext'
import type { PreparedTextWithSegments } from '@chenglou/pretext'
import type { Row } from '../types.js'

export interface UseDynamicFontOptions {
  /** Debounce delay in ms before prepare() fires on font change. Default 150. */
  debounceMs?: number
  /** Line height in px. Default 20. */
  lineHeight?: number
  /** Total horizontal cell padding in px (left + right). Default 16. */
  cellPadding?: number
}

export interface UseDynamicFontResult {
  /** One computed row height per row, ready for `<tr style={{ height }}>`. */
  rowHeights: number[]
  /**
   * Update the active font. prepare() is debounced (default 150 ms) to avoid
   * expensive Canvas re-measurement on rapid calls. layout() runs immediately
   * on each render using the previously prepared state.
   */
  setFont: (font: string) => void
  /** The font string most recently passed to setFont() (or the initialFont). */
  currentFont: string
}

/**
 * Pure helper: compute row heights from pre-measured cells and column widths.
 * Exported so tests can verify the layout arithmetic without a React render.
 */
export function computeDynamicRowHeights(
  prepared: PreparedTextWithSegments[][],
  columnWidths: number[],
  lineHeight: number,
  cellPadding: number
): number[] {
  return prepared.map((preparedCells) => {
    let maxHeight = lineHeight
    for (let col = 0; col < preparedCells.length; col++) {
      const innerWidth = Math.max((columnWidths[col] ?? 100) - cellPadding, 1)
      const h = layout(preparedCells[col], innerWidth, lineHeight).height
      if (h > maxHeight) maxHeight = h
    }
    return maxHeight
  })
}

/**
 * Extends the prepare/layout two-phase model with runtime font switching.
 *
 * - prepare()  Canvas measurement — debounced (default 150 ms) to keep rapid
 *              font changes smooth.
 * - layout()   Pure arithmetic   — runs immediately on every render using the
 *              most recently prepared state, so column-width and row-data
 *              changes remain snappy without waiting for the debounce.
 *
 * Compose with useResizable by passing the same `columnWidths` array to both:
 *
 * ```ts
 * const { columnWidths } = useResizable({ defaultColumnWidths })
 * const { rowHeights, setFont, currentFont } = useDynamicFont(rows, columnWidths, BODY_FONT)
 * ```
 */
export function useDynamicFont(
  rows: Row[],
  columnWidths: number[],
  initialFont: string,
  options?: UseDynamicFontOptions
): UseDynamicFontResult {
  const { debounceMs = 150, lineHeight = 20, cellPadding = 16 } = options ?? {}

  const [fontsReady, setFontsReady] = useState(false)
  const [currentFont, setCurrentFont] = useState(initialFont)
  const [prepared, setPrepared] = useState<PreparedTextWithSegments[][] | null>(null)

  useEffect(() => {
    document.fonts.ready.then(() => setFontsReady(true))
  }, [])

  // Stable refs so debounce and rows-change callbacks always see the latest values
  // without adding them as useEffect / useCallback dependencies.
  const fontsReadyRef = useRef(fontsReady)
  fontsReadyRef.current = fontsReady

  const rowsRef = useRef(rows)
  rowsRef.current = rows

  const currentFontRef = useRef(currentFont)
  currentFontRef.current = currentFont

  // Prepare immediately when rows or fontsReady changes, using the current font.
  // currentFont is intentionally excluded from deps — setFont() manages its own
  // debounced prepare() so the expensive Canvas phase is not triggered on every
  // rapid font change.
  useEffect(() => {
    if (!fontsReady) return
    const font = currentFontRef.current
    const p = rows.map((row) => row.cells.map((cell) => prepareWithSegments(cell, font)))
    setPrepared(p)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, fontsReady])

  // layout() — pure arithmetic, runs immediately on every prepared/columnWidths change.
  // This is the "previously prepared state" path described in the hook's contract:
  // heights are always up-to-date with the last successful prepare(), so column
  // resize interactions stay snappy even while a font debounce is pending.
  const rowHeights = useMemo(() => {
    if (!prepared) return rows.map(() => lineHeight)
    return computeDynamicRowHeights(prepared, columnWidths, lineHeight, cellPadding)
  }, [prepared, columnWidths, lineHeight, cellPadding, rows])

  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const setFont = useCallback(
    (font: string) => {
      // Update currentFont immediately so callers see the new value and table
      // CSS reflects the change without waiting for the debounce.
      setCurrentFont(font)

      // Cancel any pending prepare() before scheduling a fresh one.
      if (debounceTimerRef.current !== null) {
        clearTimeout(debounceTimerRef.current)
      }

      // Debounce prepare() — avoids expensive Canvas re-measurement on every
      // rapid call (e.g., live font-size slider). layout() continues to run on
      // each render using the previously prepared state so heights are never
      // stale with respect to column widths or row data, only with respect to
      // the pending font change itself.
      debounceTimerRef.current = setTimeout(() => {
        debounceTimerRef.current = null
        if (!fontsReadyRef.current) return
        const p = rowsRef.current.map((row) =>
          row.cells.map((cell) => prepareWithSegments(cell, font))
        )
        setPrepared(p)
      }, debounceMs)
    },
    [debounceMs]
  )

  // Clean up pending debounce timer on unmount.
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current !== null) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [])

  return { rowHeights, setFont, currentFont }
}
