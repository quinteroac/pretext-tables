import { describe, it, expect } from 'vitest'
import { measureCellHeight, measureRowHeights, LINE_HEIGHT } from '../tables/basic-table/measure.js'

// ---------------------------------------------------------------------------
// measureCellHeight — pure function, no DOM calls
// ---------------------------------------------------------------------------

describe('measureCellHeight', () => {
  it('returns a positive number for a non-empty string', () => {
    const height = measureCellHeight('Hello world', 200)
    expect(height).toBeGreaterThan(0)
  })

  it('returns 0 for an empty string (pretext reports no lines)', () => {
    const height = measureCellHeight('', 200)
    // pretext's layout() returns height 0 for empty text (no lines to lay out).
    expect(height).toBe(0)
  })

  it('returns a greater height for text that wraps than for short text', () => {
    const longText =
      'This is a very long sentence that should wrap across multiple lines when the column width is narrow enough to force wrapping.'
    const shortText = 'Hi'
    const narrowWidth = 80

    const tallHeight = measureCellHeight(longText, narrowWidth)
    const shortHeight = measureCellHeight(shortText, narrowWidth)

    expect(tallHeight).toBeGreaterThan(shortHeight)
  })

  it('is a pure function — does not touch any DOM measurement API', () => {
    // We verify pureness by confirming that no DOM measurement properties exist
    // on the global object during the call. In Node.js test environment the
    // real DOM is absent; the only document shim is the minimal canvas polyfill
    // we installed, which has no measurement APIs.
    const domApis = [
      'getBoundingClientRect',
      'offsetHeight',
      'offsetWidth',
      'clientHeight',
      'clientWidth',
      'scrollHeight',
      'scrollWidth',
    ] as const

    // None of these should exist as own properties on the minimal document
    // polyfill (they are not needed and must not be called).
    const doc = (globalThis as Record<string, unknown>)['document'] as Record<string, unknown>
    for (const api of domApis) {
      expect(Object.prototype.hasOwnProperty.call(doc, api)).toBe(false)
    }

    // The function must execute without throwing, confirming it doesn't attempt
    // to call any DOM measurement API that would blow up in a Node.js context.
    expect(() => measureCellHeight('Some text content', 150)).not.toThrow()
  })
})

// ---------------------------------------------------------------------------
// measureRowHeights — pure function, correct aggregation
// ---------------------------------------------------------------------------

describe('measureRowHeights', () => {
  it('returns an array with the same length as the rows array', () => {
    const rows = [
      { id: 'r1', cells: ['Alpha', 'Beta'] },
      { id: 'r2', cells: ['Gamma', 'Delta'] },
      { id: 'r3', cells: ['Epsilon', 'Zeta'] },
    ]
    const columnWidths = [200, 200]

    const heights = measureRowHeights(rows, columnWidths)
    expect(heights).toHaveLength(3)
  })

  it('returns at least LINE_HEIGHT for every row', () => {
    const rows = [
      { id: 'r1', cells: ['Short'] },
      { id: 'r2', cells: [''] },
    ]
    const columnWidths = [300]

    const heights = measureRowHeights(rows, columnWidths)
    for (const h of heights) {
      // measureRowHeights starts maxHeight at LINE_HEIGHT, so each row is >= LINE_HEIGHT.
      expect(h).toBeGreaterThanOrEqual(LINE_HEIGHT)
    }
  })

  it('returns a height equal to LINE_HEIGHT for a single-line row', () => {
    const rows = [{ id: 'r1', cells: ['Hi'] }]
    const columnWidths = [400]

    const [height] = measureRowHeights(rows, columnWidths)
    expect(height).toBe(LINE_HEIGHT)
  })

  it('returns the max cell height across all columns in a row', () => {
    const shortText = 'Short'
    // Force a wrap by using a very narrow column.
    const longText =
      'This sentence is deliberately long so it wraps when the column is narrow.'
    const narrowWidth = 60
    const wideWidth = 400

    const rows = [{ id: 'r1', cells: [longText, shortText] }]
    const columnWidths = [narrowWidth, wideWidth]

    const [rowHeight] = measureRowHeights(rows, columnWidths)
    const tallCellHeight = measureCellHeight(longText, narrowWidth)
    const shortCellHeight = measureCellHeight(shortText, wideWidth)

    // Row height must equal the tallest cell.
    expect(rowHeight).toBe(Math.max(tallCellHeight, shortCellHeight))
    expect(rowHeight).toBeGreaterThan(shortCellHeight)
  })

  it('handles multiple rows independently', () => {
    const rows = [
      { id: 'r1', cells: ['One line'] },
      {
        id: 'r2',
        cells: [
          'A much longer piece of text that will definitely wrap when rendered in a narrow column.',
        ],
      },
    ]
    const columnWidths = [80]

    const heights = measureRowHeights(rows, columnWidths)

    // Second row (long text, narrow column) must be taller than the first.
    expect(heights[1]).toBeGreaterThan(heights[0]!)
  })

  it('falls back to width 100 when columnWidths is shorter than cells array', () => {
    const rows = [{ id: 'r1', cells: ['A', 'B', 'C'] }]
    // Only provide width for the first column; the rest should fall back to 100.
    const columnWidths = [200]

    // Should not throw.
    expect(() => measureRowHeights(rows, columnWidths)).not.toThrow()
    const [height] = measureRowHeights(rows, columnWidths)
    expect(height).toBeGreaterThanOrEqual(LINE_HEIGHT)
  })

  it('returns an empty array when rows is empty', () => {
    const heights = measureRowHeights([], [200, 200])
    expect(heights).toEqual([])
  })

  it('is a pure function — does not touch any DOM measurement API', () => {
    const domApis = [
      'getBoundingClientRect',
      'offsetHeight',
      'offsetWidth',
      'clientHeight',
      'clientWidth',
      'scrollHeight',
      'scrollWidth',
    ] as const

    const doc = (globalThis as Record<string, unknown>)['document'] as Record<string, unknown>
    for (const api of domApis) {
      expect(Object.prototype.hasOwnProperty.call(doc, api)).toBe(false)
    }

    const rows = [
      { id: 'r1', cells: ['Hello', 'World'] },
      { id: 'r2', cells: ['Foo', 'Bar'] },
    ]
    expect(() => measureRowHeights(rows, [200, 200])).not.toThrow()
  })
})
