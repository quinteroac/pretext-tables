import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react'
import { prepareWithSegments, layout } from '@chenglou/pretext'
import type { PreparedTextWithSegments } from '@chenglou/pretext'
import { BODY_FONT } from '../fonts.js'
import type { Row } from '../types.js'

export interface UseCellNotesOptions {
  rows: Row[]
  /**
   * Note text keyed by "rowId:colIndex".
   * Only cells with a matching key receive a trigger.
   */
  notes: Record<string, string>
  columnWidths: number[]
  /** Fixed pixel width of the tooltip popover. Default 220. */
  tooltipWidth?: number
  /** CSS font shorthand. Defaults to BODY_FONT. */
  font?: string
  /** Line height in px used for layout(). Default 20. */
  lineHeight?: number
  /** Total horizontal padding (left + right) inside the tooltip. Default 16. */
  cellPadding?: number
}

export interface UseCellNotesResult {
  /**
   * Returns mouse event handlers for a cell.
   * Returns an empty object when the cell has no associated note.
   */
  getNoteTriggerProps: (rowIndex: number, colIndex: number) => React.HTMLAttributes<HTMLElement>
  /**
   * Returns true when the cell at (rowIndex, colIndex) has an associated note.
   * Use this to conditionally render a note indicator inside the cell.
   */
  hasNote: (rowIndex: number, colIndex: number) => boolean
  /**
   * Renders the active tooltip at the pre-computed position.
   * Place once anywhere in the tree — typically just outside the table container.
   * Uses `position: fixed`; no DOM measurement is required for sizing or placement.
   */
  NoteTooltip: React.FC
}

interface ActiveNote {
  key: string
  /** Mouse clientX at the moment the trigger was entered. */
  x: number
  /** Mouse clientY at the moment the trigger was entered. */
  y: number
}

// ---------------------------------------------------------------------------
// Pure helper (exported for testing)
// ---------------------------------------------------------------------------

/**
 * Computes the pixel height of every note text at `tooltipWidth` using
 * `layout()`. Pure function — no DOM reads, no side effects.
 *
 * @param preparedNotes  Record of prepared note texts keyed by "rowId:colIndex".
 * @param tooltipWidth   Total pixel width of the tooltip popover (including padding).
 * @param lineHeight     Minimum line height in px.
 * @param cellPadding    Total horizontal padding subtracted from tooltipWidth.
 * @returns              Record of pre-computed heights keyed by note key.
 */
export function computeNoteHeights(
  preparedNotes: Record<string, PreparedTextWithSegments>,
  tooltipWidth: number,
  lineHeight: number,
  cellPadding: number,
): Record<string, number> {
  const innerWidth = Math.max(tooltipWidth - cellPadding, 1)
  const result: Record<string, number> = {}
  for (const [key, prepared] of Object.entries(preparedNotes)) {
    result[key] = layout(prepared, innerWidth, lineHeight).height
  }
  return result
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * Pre-measures tooltip note texts with `prepare()` so the tooltip height is
 * known before mount — zero repositioning flash on first paint.
 *
 * Two-phase model (mirrors `useMeasure`):
 *   `prepare()` — Canvas measurement — once per notes / font change.
 *   `layout()`  — Pure arithmetic    — once per tooltipWidth change.
 *
 * No DOM measurement (`getBoundingClientRect`, `offsetHeight`, etc.) is used
 * for sizing or positioning.  Tooltip position comes from mouse event
 * coordinates; tooltip height comes from `layout()`.
 *
 * @example
 * const { getNoteTriggerProps, NoteTooltip } = useCellNotes({
 *   rows, notes, columnWidths, tooltipWidth: 220,
 * })
 *
 * // In the table cell:
 * <td {...getNoteTriggerProps(rowIndex, colIndex)}>…</td>
 *
 * // Outside the table:
 * <NoteTooltip />
 */
export function useCellNotes(options: UseCellNotesOptions): UseCellNotesResult {
  const {
    rows,
    notes,
    tooltipWidth = 220,
    font = BODY_FONT,
    lineHeight = 20,
    cellPadding = 16,
  } = options

  const [fontsReady, setFontsReady] = useState(false)
  const [active, setActive] = useState<ActiveNote | null>(null)

  useEffect(() => {
    document.fonts.ready.then(() => setFontsReady(true))
  }, [])

  // prepare() — expensive Canvas phase, once per notes / font change.
  const preparedNotes = useMemo<Record<string, PreparedTextWithSegments> | null>(() => {
    if (!fontsReady) return null
    const result: Record<string, PreparedTextWithSegments> = {}
    for (const [key, text] of Object.entries(notes)) {
      result[key] = prepareWithSegments(text, font)
    }
    return result
  }, [notes, font, fontsReady])

  // layout() — cheap arithmetic phase, once per tooltipWidth change.
  const noteHeights = useMemo<Record<string, number>>(() => {
    if (!preparedNotes) return {}
    return computeNoteHeights(preparedNotes, tooltipWidth, lineHeight, cellPadding)
  }, [preparedNotes, tooltipWidth, lineHeight, cellPadding])

  // Stable ref so the NoteTooltip component (created once) always reads fresh state.
  const stateRef = useRef({ active, notes, noteHeights, tooltipWidth, lineHeight, cellPadding })
  stateRef.current = { active, notes, noteHeights, tooltipWidth, lineHeight, cellPadding }

  const getNoteTriggerProps = useCallback(
    (rowIndex: number, colIndex: number): React.HTMLAttributes<HTMLElement> => {
      const rowId = rows[rowIndex]?.id
      if (!rowId) return {}
      const key = `${rowId}:${colIndex}`
      if (!notes[key]) return {}
      return {
        onMouseEnter(e) {
          setActive({ key, x: e.clientX, y: e.clientY })
        },
        onMouseLeave() {
          setActive(null)
        },
      }
    },
    [rows, notes],
  )

  const hasNote = useCallback(
    (rowIndex: number, colIndex: number): boolean => {
      const rowId = rows[rowIndex]?.id
      if (!rowId) return false
      return !!notes[`${rowId}:${colIndex}`]
    },
    [rows, notes],
  )

  // NoteTooltip is created once (stable identity) — reads current state from stateRef.
  // This ensures React never unmounts/remounts the tooltip between hover events.
  const NoteTooltip = useMemo<React.FC>(() => {
    return function NoteTooltipImpl() {
      const { active: a, notes: n, noteHeights: nh, tooltipWidth: tw, lineHeight: lh, cellPadding: cp } =
        stateRef.current
      if (!a) return null
      const text = n[a.key]
      if (!text) return null

      // Height is pre-computed by layout() before mount — no DOM reads needed.
      const contentHeight = nh[a.key] ?? lh
      // Vertical padding inside the tooltip (top + bottom).
      const VERTICAL_PAD = 10
      const tooltipHeight = contentHeight + VERTICAL_PAD * 2
      // Cursor offset so the tooltip doesn't sit directly under the pointer.
      const CURSOR_OFFSET_X = 14
      const CURSOR_OFFSET_Y = 12

      return (
        <div
          role="tooltip"
          style={{
            position: 'fixed',
            left: a.x + CURSOR_OFFSET_X,
            top: a.y + CURSOR_OFFSET_Y,
            width: tw,
            height: tooltipHeight,
            padding: `${VERTICAL_PAD}px ${cp / 2}px`,
            boxSizing: 'border-box',
            background: 'oklch(14% 0.02 240)',
            border: '1px solid oklch(28% 0.04 240)',
            borderRadius: 6,
            boxShadow: '0 8px 24px oklch(0% 0 0 / 0.5)',
            color: 'oklch(82% 0.01 240)',
            fontSize: 12,
            lineHeight: `${lh}px`,
            fontFamily: 'var(--font-body, system-ui, sans-serif)',
            pointerEvents: 'none',
            zIndex: 9999,
            overflow: 'hidden',
          }}
        >
          {text}
        </div>
      )
    }
    // stateRef is stable — NoteTooltip is created exactly once per hook instance.
  }, [stateRef])

  return { getNoteTriggerProps, hasNote, NoteTooltip }
}
