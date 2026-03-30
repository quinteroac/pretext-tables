import { useState, useCallback } from 'react'
import type { Row } from '../types.js'

/** Media dimensions specified as an explicit pixel height. */
export interface MediaHeightSpec {
  mediaHeight: number
}

/**
 * Media dimensions specified as width + aspect ratio.
 * `mediaHeight` is derived as `width / aspectRatio`.
 * Useful for video or image thumbnails where the intrinsic ratio is known.
 */
export interface MediaVideoSpec {
  width: number
  aspectRatio: number
}

/** Union of supported media dimension specs. No DOM measurement required. */
export type MediaSpec = MediaHeightSpec | MediaVideoSpec

/**
 * Resolves any MediaSpec to a concrete pixel height.
 * Extracted as a pure helper so it can be tested without a React renderer.
 */
export function resolveMediaHeight(spec: MediaSpec): number {
  if ('mediaHeight' in spec) return spec.mediaHeight
  return spec.width / spec.aspectRatio
}

export interface UseMediaCellsOptions {
  /**
   * Map from rowId to media dimensions. Rows absent from this map are
   * unaffected — their heights come from text alone.
   */
  media: Record<string, MediaSpec>
  /**
   * Line height in px. Must match the `lineHeight` option passed to
   * `useMeasure` so that synthetic newlines produce the correct height.
   * Default: 20.
   */
  lineHeight?: number
}

export interface UseMediaCellsResult {
  /** Current visibility state keyed by rowId. Starts as all-hidden. */
  mediaVisible: Record<string, boolean>
  /**
   * Toggle the media panel for a row.
   * No-op when rowId has no entry in `media`.
   */
  toggleMedia: (rowId: string) => void
  /**
   * Returns rows with synthetic newline padding appended to every cell for
   * rows whose media is currently visible. Pass these rows to `useMeasure`
   * instead of the originals so that:
   *   rowHeight = textHeight + mediaHeight   (no DOM measurement)
   *
   * Use the original `rows` for rendering — this output is for measurement
   * only. Padding is empty for hidden rows so `layout()` recalculates the
   * collapsed, text-only height automatically. No observer or DOM API used.
   */
  getEffectiveRows: (rows: Row[]) => Row[]
}

/**
 * Adds media-height awareness to a table whose row heights are computed by
 * `useMeasure`. All dimensions come from props — zero DOM reads, zero layout
 * reflows, no observer callbacks needed.
 *
 * Usage:
 *   const { mediaVisible, toggleMedia, getEffectiveRows } =
 *     useMediaCells({ media, lineHeight: LINE_HEIGHT })
 *
 *   const { rowHeights } = useMeasure(
 *     getEffectiveRows(rows),
 *     columnWidths,
 *     { lineHeight: LINE_HEIGHT }
 *   )
 *
 *   // Render rows with original `rows` array; rowHeights include media space.
 */
export function useMediaCells(options: UseMediaCellsOptions): UseMediaCellsResult {
  const { media, lineHeight = 20 } = options

  const [mediaVisible, setMediaVisible] = useState<Record<string, boolean>>({})

  const toggleMedia = useCallback(
    (rowId: string) => {
      if (!(rowId in media)) return
      setMediaVisible((prev) => ({ ...prev, [rowId]: !prev[rowId] }))
    },
    [media],
  )

  const getEffectiveRows = useCallback(
    (rows: Row[]): Row[] => {
      return rows.map((row) => {
        const spec = media[row.id]
        if (!spec || !mediaVisible[row.id]) return row
        // Append synthetic newlines to every cell in the row.
        // Adding k identical lines to each cell preserves max-height semantics:
        //   max(h1+k, h2+k, ...) = max(h1, h2, ...) + k  →  textHeight + mediaHeight
        const extraLines = Math.ceil(resolveMediaHeight(spec) / lineHeight)
        const padding = '\n'.repeat(extraLines)
        return { ...row, cells: row.cells.map((cell) => cell + padding) }
      })
    },
    [media, mediaVisible, lineHeight],
  )

  return { mediaVisible, toggleMedia, getEffectiveRows }
}
