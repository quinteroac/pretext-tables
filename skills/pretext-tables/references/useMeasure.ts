import { useMemo, useState, useEffect } from 'react'
import { prepareWithSegments, layout } from '@chenglou/pretext'
import type { PreparedTextWithSegments } from '@chenglou/pretext'

export type Row = { id: string; cells: string[] }

export interface UseMeasureOptions {
  /** CSS font shorthand, e.g. '14px "Inter", system-ui'. */
  font?: string
  /** Line height in px. Default 20. */
  lineHeight?: number
  /**
   * Total horizontal cell padding (left + right) in px.
   * Subtracted from column width before layout() — prevents text overflow.
   * Default 16.
   */
  cellPadding?: number
  /** 'pre-wrap' to preserve newlines in cell content. Default 'normal'. */
  whiteSpace?: 'normal' | 'pre-wrap'
}

export interface UseMeasureResult {
  /** One computed height per row. Apply as <tr style={{ height }}>. */
  rowHeights: number[]
  /**
   * The prepared text grid from prepareWithSegments().
   * null while fonts are loading.
   * Pass to useShrinkWrap, useResizePreview, etc. to avoid re-running prepare().
   */
  prepared: PreparedTextWithSegments[][] | null
}

/**
 * Two-phase model — always keep prepare() and layout() separate:
 *
 *   prepare()  Canvas font measurement. Runs once per (rows, font) change.
 *              ~19 ms for 500 texts. Memoized on [rows, font, whiteSpace].
 *
 *   layout()   Pure arithmetic line-breaking at a given width.
 *              ~0.09 ms per text. Memoized on [prepared, columnWidths].
 *
 * Returns null for `prepared` until document.fonts.ready resolves.
 * During that window, rowHeights returns placeholder heights (lineHeight per row).
 */
export function useMeasure(
  rows: Row[],
  columnWidths: number[],
  options?: UseMeasureOptions
): UseMeasureResult {
  const { font = '14px system-ui', lineHeight = 20, cellPadding = 16, whiteSpace } = options ?? {}

  const [fontsReady, setFontsReady] = useState(false)
  useEffect(() => { document.fonts.ready.then(() => setFontsReady(true)) }, [])

  const prepared = useMemo<PreparedTextWithSegments[][] | null>(() => {
    if (!fontsReady) return null
    const opts = whiteSpace !== undefined ? { whiteSpace } : undefined
    return rows.map((row) => row.cells.map((cell) => prepareWithSegments(cell, font, opts)))
  }, [rows, font, whiteSpace, fontsReady])

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
