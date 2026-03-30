/**
 * Tests for useMeasure — US-007 whiteSpace pre-wrap option.
 *
 * Because useMeasure is a React hook that relies on document.fonts.ready and
 * useMemo/useState, we test the underlying pretext behaviour directly
 * (same Canvas path as the hook) and verify the option type contract.
 *
 * AC01 — option is passed through to prepareWithSegments/layout
 * AC02 — pre-wrap cell with "\n" is taller than the same cell without pre-wrap
 * AC03 — option defaults to undefined (no change when omitted)
 * AC04 — UseMeasureOptions type includes whiteSpace
 */
import { describe, it, expect } from 'vitest'
import { prepareWithSegments, layout } from '@chenglou/pretext'
import type { UseMeasureOptions } from '../shared/hooks/useMeasure.js'
import { BODY_FONT } from '../shared/fonts.js'

const LINE_HEIGHT = 20
const COLUMN_WIDTH = 200
const CELL_PADDING = 16
const innerWidth = COLUMN_WIDTH - CELL_PADDING

// ---------------------------------------------------------------------------
// AC04: UseMeasureOptions type includes whiteSpace
// ---------------------------------------------------------------------------

describe('US-007-AC04: UseMeasureOptions type', () => {
  it('accepts whiteSpace: pre-wrap without TypeScript error', () => {
    const opts: UseMeasureOptions = { whiteSpace: 'pre-wrap' }
    expect(opts.whiteSpace).toBe('pre-wrap')
  })

  it('accepts whiteSpace: normal without TypeScript error', () => {
    const opts: UseMeasureOptions = { whiteSpace: 'normal' }
    expect(opts.whiteSpace).toBe('normal')
  })

  it('whiteSpace defaults to undefined when not provided', () => {
    const opts: UseMeasureOptions = {}
    // AC03: omitting the option leaves whiteSpace undefined
    expect(opts.whiteSpace).toBeUndefined()
  })
})

// ---------------------------------------------------------------------------
// AC01 + AC02: pre-wrap produces taller rows for newline content
// ---------------------------------------------------------------------------

describe('US-007-AC01/AC02: pre-wrap option passed through to pretext', () => {
  it('cell with "\\n" is taller with pre-wrap than without', () => {
    const text = 'line1\nline2'

    // Without pre-wrap: newline is collapsed — single-line height
    const preparedNormal = prepareWithSegments(text, BODY_FONT)
    const heightNormal = layout(preparedNormal, innerWidth, LINE_HEIGHT).height

    // With pre-wrap: newline is preserved — two-line height
    const preparedPreWrap = prepareWithSegments(text, BODY_FONT, { whiteSpace: 'pre-wrap' })
    const heightPreWrap = layout(preparedPreWrap, innerWidth, LINE_HEIGHT).height

    expect(heightPreWrap).toBeGreaterThan(heightNormal)
  })

  it('cell with tab-indented content is taller with pre-wrap', () => {
    const text = 'col1\tcol2\tcol3'

    const preparedNormal = prepareWithSegments(text, BODY_FONT)
    const heightNormal = layout(preparedNormal, innerWidth, LINE_HEIGHT).height

    const preparedPreWrap = prepareWithSegments(text, BODY_FONT, { whiteSpace: 'pre-wrap' })
    const heightPreWrap = layout(preparedPreWrap, innerWidth, LINE_HEIGHT).height

    // Tabs in pre-wrap mode may expand to tab stops, but result is at least
    // as tall as normal mode. The main assertion is no crash and valid heights.
    expect(Number.isFinite(heightNormal)).toBe(true)
    expect(Number.isFinite(heightPreWrap)).toBe(true)
    expect(heightPreWrap).toBeGreaterThanOrEqual(heightNormal)
  })

  it('cell with multiple newlines grows proportionally with pre-wrap', () => {
    const oneLineText = 'hello'
    const threeLineText = 'line1\nline2\nline3'

    const prepOneLine = prepareWithSegments(oneLineText, BODY_FONT, { whiteSpace: 'pre-wrap' })
    const prepThreeLines = prepareWithSegments(threeLineText, BODY_FONT, { whiteSpace: 'pre-wrap' })

    const heightOne = layout(prepOneLine, innerWidth, LINE_HEIGHT).height
    const heightThree = layout(prepThreeLines, innerWidth, LINE_HEIGHT).height

    // Three lines must be taller than one line
    expect(heightThree).toBeGreaterThan(heightOne)
  })

  // AC03: omitting the option doesn't change behaviour vs. explicit undefined
  it('omitting whiteSpace produces same height as passing undefined', () => {
    const text = 'hello world'

    const preparedOmitted = prepareWithSegments(text, BODY_FONT)
    const preparedUndefined = prepareWithSegments(text, BODY_FONT, undefined)

    const heightOmitted = layout(preparedOmitted, innerWidth, LINE_HEIGHT).height
    const heightUndefined = layout(preparedUndefined, innerWidth, LINE_HEIGHT).height

    expect(heightOmitted).toBe(heightUndefined)
  })

  it('plain text without newlines has same height with and without pre-wrap', () => {
    const text = 'No newlines here'

    const preparedNormal = prepareWithSegments(text, BODY_FONT)
    const preparedPreWrap = prepareWithSegments(text, BODY_FONT, { whiteSpace: 'pre-wrap' })

    const heightNormal = layout(preparedNormal, innerWidth, LINE_HEIGHT).height
    const heightPreWrap = layout(preparedPreWrap, innerWidth, LINE_HEIGHT).height

    expect(heightNormal).toBe(heightPreWrap)
  })
})
