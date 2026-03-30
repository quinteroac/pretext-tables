/**
 * useSearch — filter rows and return per-cell match coordinates.
 *
 * Two-phase model (same as useMeasure):
 *   prepare()         Canvas measurement — runs once per (rows, font) change.
 *   layoutWithLines() Pure arithmetic    — runs on every (query, columnWidths) change.
 *
 * Match coordinates are pixel-accurate rectangles inside each cell, ready to
 * be used as highlight overlays. All positions come from `layoutWithLines()`;
 * no DOM measurement APIs are used.
 */
import { useMemo, useState, useEffect } from 'react'
import { prepareWithSegments, layoutWithLines } from '@chenglou/pretext'
import type { PreparedTextWithSegments } from '@chenglou/pretext'
import { BODY_FONT } from '../fonts.js'
import type { Row } from '../types.js'

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export interface MatchRect {
  x: number
  y: number
  width: number
  height: number
}

/** Maps column index → MatchRect[] for every match in that cell. */
export type CellMatchMap = Record<number, MatchRect[]>

export interface UseSearchResult {
  /** Rows where at least one cell contains the query (case-insensitive). */
  filteredRows: Row[]
  /**
   * Parallel to `filteredRows`. Each entry is a CellMatchMap describing the
   * pixel-accurate bounding boxes of every query occurrence in that row.
   * Empty when `query` is an empty string.
   */
  matchCoords: CellMatchMap[]
}

export interface UseSearchOptions {
  /** Line height in px. Default 20. */
  lineHeight?: number
  /**
   * Total horizontal cell padding in px (left + right).
   * Subtracted from column width before layout so text never overflows.
   * Default 16 (8 px each side).
   */
  cellPadding?: number
}

// ---------------------------------------------------------------------------
// Pure helpers — exported for testability
// ---------------------------------------------------------------------------

/**
 * Computes pixel-accurate MatchRect[] for every occurrence of `query`
 * within a single prepared cell. Returns `[]` when the cell has no matches.
 *
 * Coordinates are relative to the top-left corner of the cell's inner content
 * area (i.e. after padding has been applied by the caller).
 *
 * Uses `layoutWithLines()` exclusively — no DOM measurement.
 */
export function computeCellMatchRects(
  prepared: PreparedTextWithSegments,
  font: string,
  columnWidth: number,
  query: string,
  options: { lineHeight: number; cellPadding: number }
): MatchRect[] {
  const { lineHeight, cellPadding } = options
  const innerWidth = Math.max(columnWidth - cellPadding, 1)
  const { lines } = layoutWithLines(prepared, innerWidth, lineHeight)
  const queryLower = query.toLowerCase()
  const rects: MatchRect[] = []

  for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
    const line = lines[lineIdx]
    const lineLower = line.text.toLowerCase()
    let searchFrom = 0

    while (searchFrom < lineLower.length) {
      const matchStart = lineLower.indexOf(queryLower, searchFrom)
      if (matchStart === -1) break

      const matchEnd = matchStart + query.length
      const prefixText = line.text.slice(0, matchStart)
      const matchText = line.text.slice(matchStart, matchEnd)

      // x = width of text before the match on this line
      let x = 0
      if (prefixText.length > 0) {
        const preparedPrefix = prepareWithSegments(prefixText, font)
        x = layoutWithLines(preparedPrefix, Infinity, lineHeight).lines[0]?.width ?? 0
      }

      // width = width of the matched text itself
      let width = 0
      if (matchText.length > 0) {
        const preparedMatch = prepareWithSegments(matchText, font)
        width = layoutWithLines(preparedMatch, Infinity, lineHeight).lines[0]?.width ?? 0
      }

      rects.push({ x, y: lineIdx * lineHeight, width, height: lineHeight })
      searchFrom = matchEnd
    }
  }

  return rects
}

/**
 * Pure function that applies search logic to a pre-prepared text grid.
 * Exported for unit testing without needing React hooks.
 */
export function computeSearchResults(
  rows: Row[],
  prepared: PreparedTextWithSegments[][] | null,
  columnWidths: number[],
  query: string,
  options: { lineHeight: number; cellPadding: number; font: string }
): UseSearchResult {
  if (!query) {
    return { filteredRows: rows, matchCoords: [] }
  }
  if (!prepared) {
    return { filteredRows: [], matchCoords: [] }
  }

  const { lineHeight, cellPadding, font } = options
  const queryLower = query.toLowerCase()
  const filteredRows: Row[] = []
  const matchCoords: CellMatchMap[] = []

  for (let rowIdx = 0; rowIdx < rows.length; rowIdx++) {
    const row = rows[rowIdx]
    const preparedCells = prepared[rowIdx]
    if (!preparedCells) continue

    const rowHasMatch = row.cells.some((cell) => cell.toLowerCase().includes(queryLower))
    if (!rowHasMatch) continue

    filteredRows.push(row)

    const cellMap: CellMatchMap = {}
    for (let col = 0; col < row.cells.length; col++) {
      if (!row.cells[col].toLowerCase().includes(queryLower)) continue
      const prepCell = preparedCells[col]
      if (!prepCell) continue
      const rects = computeCellMatchRects(prepCell, font, columnWidths[col] ?? 100, query, {
        lineHeight,
        cellPadding,
      })
      if (rects.length > 0) cellMap[col] = rects
    }

    matchCoords.push(cellMap)
  }

  return { filteredRows, matchCoords }
}

// ---------------------------------------------------------------------------
// React hook
// ---------------------------------------------------------------------------

/**
 * Filters `rows` by a search query and returns pixel-accurate match
 * coordinates for each matching cell, derived from `layoutWithLines()`.
 *
 * @param rows         Table data.
 * @param columnWidths Width in px for each column.
 * @param font         CSS font shorthand (use a constant from `fonts.ts`).
 * @param query        Search string. Empty string returns all rows.
 * @param options      Optional lineHeight / cellPadding overrides.
 *
 * @returns `{ filteredRows, matchCoords }` — matchCoords is parallel to
 *   filteredRows and maps column index → MatchRect[] per match occurrence.
 *
 * @example
 * ```tsx
 * const { filteredRows, matchCoords } = useSearch(rows, columnWidths, BODY_FONT, query)
 * ```
 */
export function useSearch(
  rows: Row[],
  columnWidths: number[],
  font: string = BODY_FONT,
  query: string,
  options?: UseSearchOptions
): UseSearchResult {
  const { lineHeight = 20, cellPadding = 16 } = options ?? {}

  const [fontsReady, setFontsReady] = useState(false)

  useEffect(() => {
    document.fonts.ready.then(() => setFontsReady(true))
  }, [])

  // prepare() — expensive Canvas phase, once per (rows, font) change.
  const prepared = useMemo<PreparedTextWithSegments[][] | null>(() => {
    if (!fontsReady) return null
    return rows.map((row) => row.cells.map((cell) => prepareWithSegments(cell, font)))
  }, [rows, font, fontsReady])

  return useMemo(
    () => computeSearchResults(rows, prepared, columnWidths, query, { lineHeight, cellPadding, font }),
    [rows, prepared, columnWidths, query, lineHeight, cellPadding, font]
  )
}
