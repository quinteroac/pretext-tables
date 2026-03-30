/**
 * useCanvasCell — pixel-accurate canvas cell rendering via @chenglou/pretext.
 *
 * Separates text layout (layoutWithLines) from canvas drawing. Never calls
 * prepare() internally — consumers must pass the `prepared` grid produced by
 * useMeasure (or prepareWithSegments directly).
 */
import { useMemo } from 'react'
import { layoutWithLines } from '@chenglou/pretext'
import type { PreparedTextWithSegments } from '@chenglou/pretext'
import { BODY_FONT } from '../fonts.js'

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export type CanvasCellEffect =
  | { type: 'gradient'; startColor: string; endColor: string }
  | { type: 'shadow'; color?: string; blur?: number; offsetX?: number; offsetY?: number }
  | {
      type: 'fadeTruncation'
      fadeWidth?: number
      /** Transparent edge of the fade. Default 'rgba(255,255,255,0)'. */
      fadeFrom?: string
      /** Opaque edge of the fade. Default 'rgba(255,255,255,1)'. */
      fadeTo?: string
    }

export interface UseCanvasCellOptions {
  /** CSS font shorthand. Defaults to BODY_FONT. */
  font?: string
  /** Line height in px. Default 20. */
  lineHeight?: number
  /** Padding on each horizontal side in px. Default 8. */
  cellPadding?: number
  /** Default text fill style. Default '#000000'. */
  fillStyle?: string
  /** Optional visual effect applied when drawing each line. */
  effect?: CanvasCellEffect
}

/** The drawCell callback signature returned by useCanvasCell / createDrawCell. */
export type DrawCellFn = (
  ctx: CanvasRenderingContext2D,
  rowIndex: number,
  colIndex: number,
  x: number,
  y: number,
  /** Device pixel ratio. Defaults to window.devicePixelRatio ?? 1. */
  dpr?: number
) => void

export interface UseCanvasCellInput {
  prepared: PreparedTextWithSegments[][] | null
  columnWidths: number[]
  options?: UseCanvasCellOptions
}

export interface UseCanvasCellResult {
  drawCell: DrawCellFn
}

// ---------------------------------------------------------------------------
// Pure helper — exported for testability
// ---------------------------------------------------------------------------

/**
 * Returns a `drawCell` function configured with the given prepared text grid,
 * column widths, and options. Suitable for direct use outside React.
 *
 * Uses `layoutWithLines()` exclusively for position calculations — never calls
 * `ctx.measureText` or any other Canvas measurement API.
 */
export function createDrawCell(
  prepared: PreparedTextWithSegments[][] | null,
  columnWidths: number[],
  options?: UseCanvasCellOptions
): DrawCellFn {
  const {
    font = BODY_FONT,
    lineHeight = 20,
    cellPadding = 8,
    fillStyle = '#000000',
    effect,
  } = options ?? {}

  return function drawCell(
    ctx: CanvasRenderingContext2D,
    rowIndex: number,
    colIndex: number,
    x: number,
    y: number,
    dpr: number = (typeof window !== 'undefined' ? window.devicePixelRatio : null) ?? 1
  ): void {
    if (!prepared) return
    const preparedCell = prepared[rowIndex]?.[colIndex]
    if (!preparedCell) return

    const colWidth = columnWidths[colIndex] ?? 100
    const innerWidth = Math.max(colWidth - cellPadding * 2, 1)
    const { lines } = layoutWithLines(preparedCell, innerWidth, lineHeight)

    ctx.save()
    if (dpr !== 1) ctx.scale(dpr, dpr)
    ctx.font = font
    ctx.textBaseline = 'top'

    if (effect?.type === 'shadow') {
      ctx.shadowColor = effect.color ?? 'rgba(0,0,0,0.3)'
      ctx.shadowBlur = effect.blur ?? 4
      ctx.shadowOffsetX = effect.offsetX ?? 0
      ctx.shadowOffsetY = effect.offsetY ?? 1
    }

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      const textX = x + cellPadding
      const textY = y + cellPadding + i * lineHeight

      if (effect?.type === 'gradient') {
        const grad = ctx.createLinearGradient(textX, textY, textX + line.width, textY)
        grad.addColorStop(0, effect.startColor)
        grad.addColorStop(1, effect.endColor)
        ctx.fillStyle = grad
      } else {
        ctx.fillStyle = fillStyle
      }

      ctx.fillText(line.text, textX, textY)

      if (effect?.type === 'fadeTruncation') {
        const fadeWidth = effect.fadeWidth ?? 32
        const fadeFrom = effect.fadeFrom ?? 'rgba(255,255,255,0)'
        const fadeTo = effect.fadeTo ?? 'rgba(255,255,255,1)'
        const fadeX = x + colWidth - fadeWidth
        const grad = ctx.createLinearGradient(fadeX, textY, fadeX + fadeWidth, textY)
        grad.addColorStop(0, fadeFrom)
        grad.addColorStop(1, fadeTo)
        ctx.fillStyle = grad
        ctx.fillRect(fadeX, textY, fadeWidth, lineHeight)
      }
    }

    ctx.restore()
  }
}

// ---------------------------------------------------------------------------
// React hook
// ---------------------------------------------------------------------------

/**
 * Returns `{ drawCell }` — a memoized function that renders a single table
 * cell onto a `<canvas>` at pixel-accurate positions derived from
 * `layoutWithLines()`.
 *
 * `prepared` must be the `PreparedTextWithSegments[][]` returned by
 * `useMeasure` — this hook never calls `prepare()` internally.
 *
 * @example
 * ```tsx
 * const { rowHeights, prepared } = useMeasure(rows, columnWidths)
 * const { drawCell } = useCanvasCell({ prepared, columnWidths })
 *
 * // Inside a canvas paint loop:
 * drawCell(ctx, rowIndex, colIndex, x, y)
 * ```
 */
export function useCanvasCell({ prepared, columnWidths, options }: UseCanvasCellInput): UseCanvasCellResult {
  const {
    font = BODY_FONT,
    lineHeight = 20,
    cellPadding = 8,
    fillStyle = '#000000',
    effect,
  } = options ?? {}

  const drawCell = useMemo(
    () => createDrawCell(prepared, columnWidths, { font, lineHeight, cellPadding, fillStyle, effect }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [prepared, columnWidths, font, lineHeight, cellPadding, fillStyle, effect]
  )

  return { drawCell }
}
