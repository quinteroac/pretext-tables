import { useState, useRef, useCallback, useEffect, useMemo } from 'react'
import type React from 'react'
import { prepareWithSegments, layout } from '@chenglou/pretext'
import type { PreparedTextWithSegments } from '@chenglou/pretext'
import { BODY_FONT } from '../fonts.js'
import type { Row } from '../types.js'
import { useMeasure } from './useMeasure.js'

export interface UseEditableOptions {
  font?: string
  lineHeight?: number
  cellPadding?: number
  /** How long to wait after the last keystroke before re-running prepare(). Default 150 ms. */
  debounceMs?: number
}

export interface EditCellProps {
  defaultValue: string
  onInput: React.FormEventHandler<HTMLTextAreaElement>
}

export interface UseEditableResult {
  /** One computed row height per row, updated on every keystroke. */
  previewHeights: number[]
  /**
   * Returns props to spread onto a `<textarea>` or `contenteditable` element.
   * On every `input` event, `layout()` runs against the current prepared state
   * and `previewHeights` updates in the same render frame.
   */
  getEditProps: (rowIndex: number, colIndex: number) => EditCellProps
}

/**
 * Computes the display height for one table row given the prepared-text state
 * for every cell. Pure function — no React, no DOM, no side effects.
 *
 * Exported for unit testing. Used internally by `useEditable`.
 *
 * @param rowPrepared  Prepared-text state per column (sparse: undefined entries use lineHeight).
 * @param columnWidths Column widths in px.
 * @param lineHeight   Minimum row height in px.
 * @param cellPadding  Total horizontal padding (left + right) subtracted from each column width.
 */
export function computeEditRowHeight(
  rowPrepared: Array<PreparedTextWithSegments | undefined>,
  columnWidths: number[],
  lineHeight: number,
  cellPadding: number,
): number {
  let maxHeight = lineHeight
  for (let col = 0; col < rowPrepared.length; col++) {
    const prepared = rowPrepared[col]
    if (!prepared) continue
    const innerWidth = Math.max((columnWidths[col] ?? 100) - cellPadding, 1)
    const h = layout(prepared, innerWidth, lineHeight).height
    if (h > maxHeight) maxHeight = h
  }
  return maxHeight
}

/**
 * Enables per-keystroke row-height updates for inline-editable table cells.
 *
 * Two-phase strategy (mirrors `useMeasure`):
 *   - `prepare()` is debounced (~150 ms) to avoid the expensive canvas pass
 *     on every keystroke. During the debounce window, `layout()` runs against
 *     the previous prepared state, giving immediate visual feedback.
 *   - `layout()` (pure arithmetic) runs synchronously on every `input` event.
 *
 * Composable with `useResizable`: pass `columnWidths` from `useResizable` and
 * the resized widths are honoured automatically during editing.
 *
 * No DOM measurement (`getBoundingClientRect`, `offsetHeight`, `ResizeObserver`)
 * is used to determine `previewHeights`.
 */
export function useEditable(
  rows: Row[],
  columnWidths: number[],
  options?: UseEditableOptions,
): UseEditableResult {
  const { font = BODY_FONT, lineHeight = 20, cellPadding = 16, debounceMs = 150 } = options ?? {}

  // Base measurement — provides initial heights and the baseline prepared state.
  const { rowHeights: baseHeights, prepared: basePrepared } = useMeasure(rows, columnWidths, {
    font,
    lineHeight,
    cellPadding,
  })

  // Per-cell prepared overrides (keyed by `${rowIndex}_${colIndex}`).
  // Updated asynchronously after the debounce window settles.
  // Stored in a ref so reads in useMemo always see the latest value without
  // creating circular dependency issues.
  const editPreparedRef = useRef<Map<string, PreparedTextWithSegments>>(new Map())

  // Pending debounce timer handles.
  const debounceTimersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())

  // Tracks which cells are in an edited state.
  // Also acts as a render trigger: updating this Map causes useMemo to re-run
  // previewHeights with the latest editPreparedRef state.
  const [editCells, setEditCells] = useState<Map<string, string>>(new Map())

  // Clear all edit state when the rows dataset is replaced.
  useEffect(() => {
    editPreparedRef.current.clear()
    setEditCells(new Map())
  }, [rows])

  // Cancel pending timers on unmount to prevent state updates on dead components.
  useEffect(() => {
    return () => {
      debounceTimersRef.current.forEach((timer) => clearTimeout(timer))
    }
  }, [])

  // Compute preview heights using layout() — pure arithmetic, no canvas.
  // Re-runs whenever basePrepared, editCells, or columnWidths change.
  const previewHeights = useMemo<number[]>(() => {
    if (!basePrepared) return baseHeights
    if (editCells.size === 0) return baseHeights

    return rows.map((row, rowIndex) => {
      const rowPrepared: Array<PreparedTextWithSegments | undefined> = row.cells.map(
        (_cell, colIndex) => {
          const key = `${rowIndex}_${colIndex}`
          // If this cell has been edited, use the most recent debounced prepared
          // state (may be from previous text during the debounce window —
          // intentional per AC03). Fall back to base prepared when no edit exists.
          return editCells.has(key)
            ? (editPreparedRef.current.get(key) ?? basePrepared[rowIndex]?.[colIndex])
            : basePrepared[rowIndex]?.[colIndex]
        },
      )
      return computeEditRowHeight(rowPrepared, columnWidths, lineHeight, cellPadding)
    })
  }, [basePrepared, baseHeights, editCells, rows, columnWidths, lineHeight, cellPadding])

  const getEditProps = useCallback(
    (rowIndex: number, colIndex: number): EditCellProps => {
      const key = `${rowIndex}_${colIndex}`
      return {
        defaultValue: rows[rowIndex]?.cells[colIndex] ?? '',
        onInput(e: React.FormEvent<HTMLTextAreaElement>) {
          const value = e.currentTarget.value

          // Mark this cell as edited and trigger an immediate layout() pass
          // via the previewHeights useMemo — "same frame" update per AC02.
          setEditCells((prev) => {
            const next = new Map(prev)
            next.set(key, value)
            return next
          })

          // Debounce the expensive prepare() canvas pass.
          const existing = debounceTimersRef.current.get(key)
          if (existing !== undefined) clearTimeout(existing)

          const timer = setTimeout(() => {
            const prepared = prepareWithSegments(value, font)
            editPreparedRef.current.set(key, prepared)
            debounceTimersRef.current.delete(key)
            // Nudge state to pick up the refreshed prepared result in previewHeights.
            setEditCells((prev) => new Map(prev))
          }, debounceMs)

          debounceTimersRef.current.set(key, timer)
        },
      }
    },
    [rows, font, debounceMs],
  )

  return { previewHeights, getEditProps }
}
