/**
 * useExportCanvas — export the full table as a PNG Blob.
 *
 * Two pure helpers are exported for testability:
 *   renderTableToContext — draws all rows onto a given CanvasRenderingContext2D.
 *   renderTableToBlob    — creates an offscreen canvas and returns Promise<Blob>.
 *
 * The hook wraps both with React memoisation.  prepare() is called inside
 * a useMemo (never in a render function or component body).
 */
import { useMemo, useState, useEffect, useCallback } from 'react'
import { prepareWithSegments, layout, layoutWithLines } from '@chenglou/pretext'
import type { PreparedTextWithSegments } from '@chenglou/pretext'
import { BODY_FONT } from '../fonts.js'
import type { Row } from '../types.js'

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export interface UseExportCanvasOptions {
  /** Line height in px. Default 20. */
  lineHeight?: number
  /**
   * Total horizontal cell padding in px (left + right).
   * Default 16 (8 px each side).
   */
  cellPadding?: number
  /** Text fill colour. Default '#000000'. */
  fillStyle?: string
  /** Canvas background colour. Default '#ffffff'. */
  background?: string
}

export interface UseExportCanvasResult {
  /** Renders all rows to an offscreen canvas and resolves with a PNG Blob. */
  exportCanvas: () => Promise<Blob>
}

// ---------------------------------------------------------------------------
// Pure helpers — exported for testability
// ---------------------------------------------------------------------------

/**
 * Draws the full table onto an already-sized `CanvasRenderingContext2D`.
 *
 * All geometry (row heights, line positions) is derived from `layout()` and
 * `layoutWithLines()` — `ctx.measureText` is never called.
 *
 * Returns the computed canvas dimensions so callers can size the canvas
 * before calling this function, or verify output in tests.
 */
export function renderTableToContext(
  ctx: CanvasRenderingContext2D,
  prepared: PreparedTextWithSegments[][],
  columnWidths: number[],
  font: string,
  options?: UseExportCanvasOptions,
): { width: number; height: number; rowHeights: number[] } {
  const {
    lineHeight = 20,
    cellPadding = 16,
    fillStyle = '#000000',
    background = '#ffffff',
  } = options ?? {}

  // layout() — pure arithmetic, computes row heights without any DOM access
  const rowHeights = prepared.map((preparedRow) => {
    let maxH = lineHeight
    for (let col = 0; col < preparedRow.length; col++) {
      const innerW = Math.max((columnWidths[col] ?? 100) - cellPadding, 1)
      const h = layout(preparedRow[col], innerW, lineHeight).height
      if (h > maxH) maxH = h
    }
    return maxH
  })

  const totalWidth = columnWidths.reduce((s, w) => s + w, 0)
  const totalHeight = rowHeights.reduce((s, h) => s + h, 0)

  ctx.fillStyle = background
  ctx.fillRect(0, 0, totalWidth, totalHeight)

  ctx.font = font
  ctx.textBaseline = 'top'

  let y = 0
  for (let row = 0; row < prepared.length; row++) {
    let x = 0
    for (let col = 0; col < prepared[row].length; col++) {
      const colWidth = columnWidths[col] ?? 100
      const innerWidth = Math.max(colWidth - cellPadding, 1)
      // layoutWithLines() for text positions — zero ctx.measureText calls
      const { lines } = layoutWithLines(prepared[row][col], innerWidth, lineHeight)
      ctx.fillStyle = fillStyle
      for (let i = 0; i < lines.length; i++) {
        ctx.fillText(
          lines[i].text,
          x + cellPadding / 2,
          y + cellPadding / 2 + i * lineHeight,
        )
      }
      x += colWidth
    }
    y += rowHeights[row]
  }

  return { width: totalWidth, height: totalHeight, rowHeights }
}

/**
 * Creates an offscreen `<canvas>`, renders the complete table, and resolves
 * with a PNG `Blob`.  Uses `layout()` / `layoutWithLines()` for all geometry
 * — no `getBoundingClientRect`, no `offsetHeight`, no `ctx.measureText`.
 */
export function renderTableToBlob(
  prepared: PreparedTextWithSegments[][],
  columnWidths: number[],
  font: string,
  options?: UseExportCanvasOptions,
): Promise<Blob> {
  const { lineHeight = 20, cellPadding = 16 } = options ?? {}

  // Pre-compute dimensions so the canvas is the right size before drawing.
  const rowHeights = prepared.map((preparedRow) => {
    let maxH = lineHeight
    for (let col = 0; col < preparedRow.length; col++) {
      const innerW = Math.max((columnWidths[col] ?? 100) - cellPadding, 1)
      const h = layout(preparedRow[col], innerW, lineHeight).height
      if (h > maxH) maxH = h
    }
    return maxH
  })

  const totalWidth = Math.max(columnWidths.reduce((s, w) => s + w, 0), 1)
  const totalHeight = Math.max(rowHeights.reduce((s, h) => s + h, 0), 1)

  const canvas = document.createElement('canvas') as HTMLCanvasElement
  canvas.width = totalWidth
  canvas.height = totalHeight

  const ctx = canvas.getContext('2d')
  if (!ctx) return Promise.reject(new Error('Could not obtain 2D canvas context'))

  renderTableToContext(ctx, prepared, columnWidths, font, options)

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('canvas.toBlob returned null'))),
      'image/png',
    )
  })
}

// ---------------------------------------------------------------------------
// React hook
// ---------------------------------------------------------------------------

/**
 * Returns `{ exportCanvas: () => Promise<Blob> }`.
 *
 * `exportCanvas()` renders **all** rows (not just a visible window) to an
 * offscreen `<canvas>` and resolves with a PNG `Blob`.  All cell dimensions
 * are computed by `@chenglou/pretext` — no DOM measurements.
 *
 * `prepare()` runs inside a `useMemo` keyed on `rows` and `font`, so it
 * never executes on the render path.
 *
 * @example
 * ```tsx
 * const { exportCanvas } = useExportCanvas(rows, columnWidths)
 * const blob = await exportCanvas()
 * const url = URL.createObjectURL(blob)
 * ```
 */
export function useExportCanvas(
  rows: Row[],
  columnWidths: number[],
  font?: string,
  options?: UseExportCanvasOptions,
): UseExportCanvasResult {
  const resolvedFont = font ?? BODY_FONT

  const [fontsReady, setFontsReady] = useState(false)

  useEffect(() => {
    document.fonts.ready.then(() => setFontsReady(true))
  }, [])

  // prepare() — Canvas measurement phase, runs once per (rows, font) change.
  const prepared = useMemo<PreparedTextWithSegments[][] | null>(() => {
    if (!fontsReady) return null
    return rows.map((row) => row.cells.map((cell) => prepareWithSegments(cell, resolvedFont)))
  }, [rows, resolvedFont, fontsReady])

  const exportCanvas = useCallback((): Promise<Blob> => {
    if (prepared !== null) {
      return renderTableToBlob(prepared, columnWidths, resolvedFont, options)
    }
    // Fonts not yet signalled by React state — wait, then prepare and render.
    return document.fonts.ready.then(() => {
      const freshPrepared = rows.map((row) =>
        row.cells.map((cell) => prepareWithSegments(cell, resolvedFont)),
      )
      return renderTableToBlob(freshPrepared, columnWidths, resolvedFont, options)
    })
  }, [prepared, rows, columnWidths, resolvedFont, options])

  return { exportCanvas }
}
