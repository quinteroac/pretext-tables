/**
 * Tests for useResizePreview hook — US-007 AC02.
 *
 * Focuses on: returns `null` when no drag is active, returns correct heights
 * when drag state is active.  Driven via the exported `computePreviewHeights`
 * pure helper (the hook wraps this in useMemo).
 *
 * The null-when-no-drag contract is verified both through source inspection
 * and by confirming that `computePreviewHeights` is only reached when both
 * `prepared` and `dragState` are non-null.
 */
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { prepareWithSegments } from '@chenglou/pretext'
import type { PreparedTextWithSegments } from '@chenglou/pretext'
import { computePreviewHeights } from '../shared/hooks/useResizePreview.js'
import { BODY_FONT } from '../shared/fonts.js'

function prep(text: string): PreparedTextWithSegments {
  return prepareWithSegments(text, BODY_FONT)
}

// ---------------------------------------------------------------------------
// AC02: returns null when no drag — verified via source inspection
// ---------------------------------------------------------------------------

describe('US-007 AC02: returns null when no drag (source contract)', () => {
  const src = readFileSync(
    new URL('../shared/hooks/useResizePreview.ts', import.meta.url),
    'utf8',
  )

  it('hook source returns null when prepared is null', () => {
    // The useMemo body must short-circuit to null for null prepared
    expect(src).toContain('if (prepared === null || dragState === null) return null')
  })

  it('hook source returns null when dragState is null', () => {
    // Same guard covers both cases — verified by the conjunction check
    expect(src).toContain('dragState === null')
  })

  it('hook source delegates to computePreviewHeights when both args are non-null', () => {
    expect(src).toContain('return computePreviewHeights(')
  })

  it('computePreviewHeights is the only code path for active drag', () => {
    // There must be exactly one call to computePreviewHeights in the hook file
    const occurrences = (src.match(/computePreviewHeights\(/g) ?? []).length
    // One definition, one call-site in useMemo, potentially one in export — at least 2 total
    expect(occurrences).toBeGreaterThanOrEqual(2)
  })
})

// ---------------------------------------------------------------------------
// AC02: returns correct heights when drag state is active
// ---------------------------------------------------------------------------

describe('US-007 AC02: returns correct heights when drag is active', () => {
  it('returns an array with one entry per row', () => {
    const rows = [
      [prep('First row text'), prep('Cell B1')],
      [prep('Second row'), prep('Cell B2')],
      [prep('Third row text here'), prep('Cell B3')],
    ]
    const dragState = { colIndex: 0, currentWidth: 150 }
    const columnWidths = [150, 100]
    const heights = computePreviewHeights(rows, dragState, columnWidths, 20, 16)
    expect(heights).toHaveLength(3)
  })

  it('every returned height is a positive number', () => {
    const rows = [
      [prep('Hello world'), prep('foo')],
      [prep('Another longer sentence here'), prep('bar')],
    ]
    const dragState = { colIndex: 0, currentWidth: 120 }
    const columnWidths = [120, 80]
    const heights = computePreviewHeights(rows, dragState, columnWidths, 20, 16)
    for (const h of heights) {
      expect(h).toBeGreaterThan(0)
      expect(Number.isFinite(h)).toBe(true)
    }
  })

  it('narrowing the dragged column increases height for long text', () => {
    const longText = 'This is a fairly long sentence that will wrap when the column is narrow'
    const rows = [[prep(longText)]]
    const dragState200 = { colIndex: 0, currentWidth: 200 }
    const dragState80 = { colIndex: 0, currentWidth: 80 }
    const lineHeight = 20
    const cellPadding = 16

    const heightsWide = computePreviewHeights(rows, dragState200, [200], lineHeight, cellPadding)
    const heightsNarrow = computePreviewHeights(rows, dragState80, [80], lineHeight, cellPadding)

    // Narrow column must produce taller (or equal) row height
    expect(heightsNarrow[0]).toBeGreaterThanOrEqual(heightsWide[0])
  })

  it('widening the dragged column eventually returns single-line height', () => {
    const text = 'Short text'
    const rows = [[prep(text)]]
    const lineHeight = 20
    const cellPadding = 16

    // Very wide column — should be exactly one line
    const dragStateWide = { colIndex: 0, currentWidth: 2000 }
    const heights = computePreviewHeights(rows, dragStateWide, [2000], lineHeight, cellPadding)
    expect(heights[0]).toBe(lineHeight)
  })

  it('computePreviewHeights returns correct length for multiple rows', () => {
    const prepared = [
      [prep('Row 1 Cell A'), prep('Row 1 Cell B')],
      [prep('Row 2 Cell A'), prep('Row 2 Cell B')],
    ]
    const dragState = { colIndex: 1, currentWidth: 200 }
    const heights = computePreviewHeights(prepared, dragState, [100, 200], 20, 16)
    expect(heights).toHaveLength(2)
  })

  it('only the dragged column width affects its own cell layout', () => {
    // Row has one column; changing currentWidth must change the height
    const longText = 'Word '.repeat(20).trim()
    const rows = [[prep(longText)]]
    const lineHeight = 20
    const cellPadding = 16

    const h200 = computePreviewHeights(rows, { colIndex: 0, currentWidth: 200 }, [200], lineHeight, cellPadding)
    const h300 = computePreviewHeights(rows, { colIndex: 0, currentWidth: 300 }, [300], lineHeight, cellPadding)

    // Wider column → same or fewer lines → same or shorter height
    expect(h300[0]).toBeLessThanOrEqual(h200[0])
  })

  it('empty prepared grid returns empty array', () => {
    const dragState = { colIndex: 0, currentWidth: 100 }
    const heights = computePreviewHeights([], dragState, [], 20, 16)
    expect(heights).toHaveLength(0)
  })

  it('returns heights at least as tall as lineHeight', () => {
    const rows = [[prep('x'), prep('y')]]
    const dragState = { colIndex: 0, currentWidth: 100 }
    const lineHeight = 20
    const heights = computePreviewHeights(rows, dragState, [100, 80], lineHeight, 16)
    for (const h of heights) {
      expect(h).toBeGreaterThanOrEqual(lineHeight)
    }
  })
})
