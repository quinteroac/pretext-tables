import { useMemo, useState, useEffect } from 'react'
import { prepareWithSegments, layout } from '@chenglou/pretext'
import type { PreparedTextWithSegments } from '@chenglou/pretext'
import { BODY_FONT } from '../fonts.js'
import type { Row } from '../types.js'

export interface UseMeasureOptions {
  /** CSS font shorthand. Defaults to BODY_FONT. */
  font?: string
  /** Line height in px. Default 20. */
  lineHeight?: number
  /**
   * Total horizontal cell padding in px (left + right).
   * Subtracted from column width before layout() so text never overflows.
   * Default 16 (8 px each side).
   */
  cellPadding?: number
}

export interface UseMeasureResult {
  /** One computed row height per row, ready for `<tr style={{ height }}>`. */
  rowHeights: number[]
  /**
   * The prepared text grid produced by `prepareWithSegments()`.
   * `null` while fonts are loading. Expose so consumers can pass it to hooks
   * like `useShrinkWrap` without re-running `prepare()` themselves.
   */
  prepared: PreparedTextWithSegments[][] | null
}

/**
 * Computes and maintains row heights for a table using @chenglou/pretext.
 *
 * Two-phase model — prepare() and layout() are always kept separate:
 *   prepare()  Canvas measurement — runs once per (rows, font) change.
 *   layout()   Pure arithmetic   — runs on every columnWidths change.
 *
 * Returns `{ rowHeights, prepared }`. Use `rowHeights` for `<tr>` heights and
 * `prepared` to feed hooks like `useShrinkWrap` without duplicating prepare().
 */
export function useMeasure(
  rows: Row[],
  columnWidths: number[],
  options?: UseMeasureOptions
): UseMeasureResult {
  const { font = BODY_FONT, lineHeight = 20, cellPadding = 16 } = options ?? {}

  const [fontsReady, setFontsReady] = useState(false)

  useEffect(() => {
    document.fonts.ready.then(() => setFontsReady(true))
  }, [])

  // prepare() — expensive Canvas phase, runs only when rows or font changes.
  const prepared = useMemo<PreparedTextWithSegments[][] | null>(() => {
    if (!fontsReady) return null
    return rows.map((row) => row.cells.map((cell) => prepareWithSegments(cell, font)))
  }, [rows, font, fontsReady])

  // layout() — cheap arithmetic phase, runs on every column-width change.
  const rowHeights = useMemo(() => {
    if (!prepared) return rows.map(() => lineHeight)
    return prepared.map((preparedCells) => {
      let maxHeight = lineHeight
      for (let col = 0; col < preparedCells.length; col++) {
        const innerWidth = Math.max((columnWidths[col] ?? 100) - cellPadding, 1)
        const h = layout(preparedCells[col], innerWidth, lineHeight).height
        if (h > maxHeight) maxHeight = h
      }
      return maxHeight
    })
  }, [prepared, columnWidths, lineHeight, cellPadding])

  return { rowHeights, prepared }
}
