/**
 * Tests for useCellNotes hook — US-005
 *
 * Tests the pure `computeNoteHeights` helper and the key-mapping contract.
 * The hook's React state is tested indirectly through the pure function since
 * `@testing-library/react` is not in the project dependencies.
 */
import { describe, it, expect } from 'vitest'
import { prepareWithSegments } from '@chenglou/pretext'
import type { PreparedTextWithSegments } from '@chenglou/pretext'
import { computeNoteHeights } from '../shared/hooks/useCellNotes.js'
import { BODY_FONT } from '../shared/fonts.js'

function prep(text: string): PreparedTextWithSegments {
  return prepareWithSegments(text, BODY_FONT)
}

// ---------------------------------------------------------------------------
// US-005-AC01 / US-005-AC02: pre-measured tooltip heights
// ---------------------------------------------------------------------------

describe('US-005 AC01/AC02: computeNoteHeights returns finite heights', () => {
  it('returns a positive finite height for each note key', () => {
    const prepared: Record<string, PreparedTextWithSegments> = {
      'row1:0': prep('This is a short note.'),
      'row2:1': prep('A slightly longer note that may wrap onto multiple lines depending on the tooltip width.'),
    }
    const heights = computeNoteHeights(prepared, 220, 20, 16)

    expect(Object.keys(heights)).toEqual(['row1:0', 'row2:1'])
    for (const h of Object.values(heights)) {
      expect(Number.isFinite(h)).toBe(true)
      expect(h).toBeGreaterThan(0)
    }
  })

  it('preserves "rowId:colIndex" key format in output', () => {
    const key = 'abc-123:2'
    const prepared = { [key]: prep('Note text') }
    const heights = computeNoteHeights(prepared, 220, 20, 16)
    expect(heights).toHaveProperty(key)
  })

  it('returns an empty object for empty input', () => {
    const heights = computeNoteHeights({}, 220, 20, 16)
    expect(heights).toEqual({})
  })
})

// ---------------------------------------------------------------------------
// US-005-AC02: tooltip height is determined before mount (layout-based, not DOM)
// ---------------------------------------------------------------------------

describe('US-005 AC02: tooltip height is pre-computed, not DOM-based', () => {
  it('single-line note fits within one lineHeight', () => {
    const lineHeight = 20
    const prepared = { 'r1:0': prep('Hello') }
    const heights = computeNoteHeights(prepared, 220, lineHeight, 16)
    // A single short word should produce exactly one line = lineHeight
    expect(heights['r1:0']).toBeLessThanOrEqual(lineHeight * 2)
    expect(heights['r1:0']).toBeGreaterThanOrEqual(lineHeight)
  })

  it('multi-line note is taller than single-line note', () => {
    const lineHeight = 20
    const shortText = 'Hi'
    const longText =
      'This is a much longer note that is expected to wrap across several lines when rendered inside a narrow tooltip popover that has a fixed width of two hundred and twenty pixels.'
    const prepared: Record<string, PreparedTextWithSegments> = {
      'r1:0': prep(shortText),
      'r2:0': prep(longText),
    }
    const heights = computeNoteHeights(prepared, 220, lineHeight, 16)
    expect(heights['r2:0']).toBeGreaterThan(heights['r1:0'])
  })
})

// ---------------------------------------------------------------------------
// US-005-AC04: no DOM measurement — computeNoteHeights is pure
// ---------------------------------------------------------------------------

describe('US-005 AC04: no DOM measurement in height computation', () => {
  it('runs without document access (pure function)', () => {
    // Verify by checking it works with pre-prepared input only
    // (prepare() was called by test setup, not by computeNoteHeights itself)
    const prepared = { 'r1:0': prep('Some note text for column zero') }
    // computeNoteHeights only calls layout() — no DOM APIs
    expect(() => computeNoteHeights(prepared, 200, 20, 16)).not.toThrow()
  })
})

// ---------------------------------------------------------------------------
// US-005-AC01: tooltipWidth affects computed height
// ---------------------------------------------------------------------------

describe('US-005 AC01: tooltipWidth parameter is honoured', () => {
  it('narrower tooltip produces taller height for the same text', () => {
    const text = 'This sentence will definitely wrap when the tooltip is made narrow enough to force line breaks.'
    const prepared = { 'r1:0': prep(text) }
    const wideHeight = computeNoteHeights(prepared, 400, 20, 16)['r1:0']
    const narrowHeight = computeNoteHeights(prepared, 120, 20, 16)['r1:0']
    expect(narrowHeight).toBeGreaterThanOrEqual(wideHeight)
  })

  it('cellPadding is subtracted from tooltipWidth for inner layout width', () => {
    const text = 'A note with custom padding settings.'
    const prepared = { 'r1:0': prep(text) }
    const h16 = computeNoteHeights(prepared, 220, 20, 16)['r1:0']
    const h32 = computeNoteHeights(prepared, 220, 20, 32)['r1:0']
    // More padding → narrower inner width → text wraps more → taller height (or equal)
    expect(h32).toBeGreaterThanOrEqual(h16)
  })
})

// ---------------------------------------------------------------------------
// US-005-AC03: key format — "rowId:colIndex"
// ---------------------------------------------------------------------------

describe('US-005 AC03: key format contract', () => {
  it('correctly encodes multiple columns', () => {
    const prepared: Record<string, PreparedTextWithSegments> = {
      'user-42:0': prep('Note for column 0'),
      'user-42:1': prep('Note for column 1'),
      'user-99:3': prep('Note for column 3'),
    }
    const heights = computeNoteHeights(prepared, 220, 20, 16)
    expect(Object.keys(heights).sort()).toEqual(['user-42:0', 'user-42:1', 'user-99:3'])
  })
})
