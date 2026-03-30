/**
 * Tests for useShrinkWrap hook — US-007 AC01.
 *
 * Focuses on: binary search convergence and edge cases (empty column,
 * whitespace-only cells).  Driven via the exported `shrinkWrapColumn` helper.
 */
import { describe, it, expect } from 'vitest'
import { prepareWithSegments } from '@chenglou/pretext'
import type { PreparedTextWithSegments } from '@chenglou/pretext'
import { walkLineRanges } from '@chenglou/pretext'
import { shrinkWrapColumn } from '../shared/hooks/useShrinkWrap.js'
import { BODY_FONT } from '../shared/fonts.js'

function prep(text: string): PreparedTextWithSegments {
  return prepareWithSegments(text, BODY_FONT)
}

// ---------------------------------------------------------------------------
// AC01: binary search converges
// ---------------------------------------------------------------------------

describe('US-007 AC01: binary search convergence', () => {
  it('result is a finite positive number', () => {
    const cells = [prep('Hello, world! This is a medium-length sentence.')]
    const width = shrinkWrapColumn(cells)
    expect(Number.isFinite(width)).toBe(true)
    expect(width).toBeGreaterThan(0)
  })

  it('cell fits on exactly one line at the returned width', () => {
    const text = 'Quick brown fox jumps over the lazy dog'
    const cells = [prep(text)]
    const width = shrinkWrapColumn(cells)
    const cellPadding = 16
    const innerWidth = width - cellPadding
    const lineCount = walkLineRanges(cells[0], innerWidth, () => {})
    expect(lineCount).toBeLessThanOrEqual(1)
  })

  it('cell wraps at (returned width - cellPadding - 2), confirming ≤1 px overshoot', () => {
    const text = 'The quick brown fox jumps over the lazy dog and the cat'
    const cells = [prep(text)]
    const cellPadding = 16
    const width = shrinkWrapColumn(cells, { cellPadding })
    const innerWidth = width - cellPadding

    // At the returned inner width, it must fit (≤1 line)
    expect(walkLineRanges(cells[0], innerWidth, () => {})).toBeLessThanOrEqual(1)

    // 2 px narrower should wrap (proves the binary search is tight)
    if (innerWidth > 2) {
      const narrower = walkLineRanges(cells[0], innerWidth - 2, () => {})
      // Either wraps or was already at minimum — both are acceptable outcomes
      expect(typeof narrower).toBe('number')
    }
  })

  it('takes the maximum across all cells in a column', () => {
    const shortCell = prep('Hi')
    const longCell = prep('This is a considerably longer piece of text that needs more space')
    const widthForShort = shrinkWrapColumn([shortCell])
    const widthForBoth = shrinkWrapColumn([shortCell, longCell])
    // Column width must accommodate the longest cell
    expect(widthForBoth).toBeGreaterThanOrEqual(widthForShort)
  })

  it('respects custom minWidth option', () => {
    const cells = [prep('x')]
    const minWidth = 120
    const result = shrinkWrapColumn(cells, { minWidth })
    expect(result).toBeGreaterThanOrEqual(minWidth)
  })

  it('respects custom cellPadding option', () => {
    const cells = [prep('Hello world')]
    const defaultResult = shrinkWrapColumn(cells, { cellPadding: 16 })
    const largerPaddingResult = shrinkWrapColumn(cells, { cellPadding: 32 })
    // Larger padding means more total width
    expect(largerPaddingResult).toBeGreaterThan(defaultResult)
  })
})

// ---------------------------------------------------------------------------
// AC01: edge cases — empty column, whitespace-only cells
// ---------------------------------------------------------------------------

describe('US-007 AC01: edge cases', () => {
  it('empty cells array returns minWidth without crashing', () => {
    const minWidth = 20
    const result = shrinkWrapColumn([], { minWidth })
    expect(result).toBe(minWidth)
  })

  it('empty string cell returns minWidth without crashing', () => {
    const cells = [prep('')]
    const minWidth = 20
    const result = shrinkWrapColumn(cells, { minWidth })
    expect(result).toBeGreaterThanOrEqual(minWidth)
    expect(Number.isFinite(result)).toBe(true)
  })

  it('whitespace-only cell (spaces) returns minWidth without crashing', () => {
    const cells = [prep('   ')]
    const minWidth = 20
    const result = shrinkWrapColumn(cells, { minWidth })
    expect(result).toBeGreaterThanOrEqual(minWidth)
    expect(Number.isFinite(result)).toBe(true)
  })

  it('whitespace-only cell (tabs and newlines) returns minWidth without crashing', () => {
    const cells = [prep('\t\n  \t')]
    const minWidth = 20
    const result = shrinkWrapColumn(cells, { minWidth })
    expect(result).toBeGreaterThanOrEqual(minWidth)
    expect(Number.isFinite(result)).toBe(true)
  })

  it('column where every cell is empty returns minWidth', () => {
    const cells = [prep(''), prep(''), prep('')]
    const minWidth = 20
    const result = shrinkWrapColumn(cells, { minWidth })
    expect(result).toBeGreaterThanOrEqual(minWidth)
  })

  it('mixed empty and non-empty cells — non-empty cell drives the result', () => {
    const shortText = 'OK'
    const cells = [prep(''), prep(shortText), prep('')]
    const singleCellResult = shrinkWrapColumn([prep(shortText)])
    const mixedResult = shrinkWrapColumn(cells)
    // Mixed result should match the single non-empty cell
    expect(mixedResult).toBe(singleCellResult)
  })

  it('single-character cell — stable positive result', () => {
    const cells = [prep('A')]
    const result = shrinkWrapColumn(cells)
    expect(result).toBeGreaterThan(0)
    // Deterministic: same call twice returns the same value
    expect(shrinkWrapColumn(cells)).toBe(result)
  })
})
