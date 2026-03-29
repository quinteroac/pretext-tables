import { describe, it, expect } from 'vitest'
import { measureCellHeight, measureRowHeights, LINE_HEIGHT } from '../tables/basic-table/measure.js'
import type { Column, TableRow } from '../shared/types.js'

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

    expect(() => measureCellHeight('Some text content', 150)).not.toThrow()
  })
})

// ---------------------------------------------------------------------------
// measureRowHeights — pure function, correct aggregation
// ---------------------------------------------------------------------------

describe('measureRowHeights', () => {
  it('returns an array with the same length as the rows array', () => {
    const columns: Column[] = [
      { key: 'a', header: 'A', width: 200 },
      { key: 'b', header: 'B', width: 200 },
    ]
    const rows: TableRow[] = [
      { id: 'r1', a: 'Alpha', b: 'Beta' },
      { id: 'r2', a: 'Gamma', b: 'Delta' },
      { id: 'r3', a: 'Epsilon', b: 'Zeta' },
    ]

    const heights = measureRowHeights(rows, columns)
    expect(heights).toHaveLength(3)
  })

  it('returns at least LINE_HEIGHT for every row', () => {
    const columns: Column[] = [{ key: 'a', header: 'A', width: 300 }]
    const rows: TableRow[] = [
      { id: 'r1', a: 'Short' },
      { id: 'r2', a: '' },
    ]

    const heights = measureRowHeights(rows, columns)
    for (const h of heights) {
      expect(h).toBeGreaterThanOrEqual(LINE_HEIGHT)
    }
  })

  it('returns a height equal to LINE_HEIGHT for a single-line row', () => {
    const columns: Column[] = [{ key: 'a', header: 'A', width: 400 }]
    const rows: TableRow[] = [{ id: 'r1', a: 'Hi' }]

    const [height] = measureRowHeights(rows, columns)
    expect(height).toBe(LINE_HEIGHT)
  })

  it('returns the max cell height across all columns in a row', () => {
    const shortText = 'Short'
    const longText =
      'This sentence is deliberately long so it wraps when the column is narrow.'
    const narrowWidth = 60
    const wideWidth = 400

    const columns: Column[] = [
      { key: 'a', header: 'A', width: narrowWidth },
      { key: 'b', header: 'B', width: wideWidth },
    ]
    const rows: TableRow[] = [{ id: 'r1', a: longText, b: shortText }]

    const [rowHeight] = measureRowHeights(rows, columns)
    const tallCellHeight = measureCellHeight(longText, narrowWidth)
    const shortCellHeight = measureCellHeight(shortText, wideWidth)

    expect(rowHeight).toBe(Math.max(tallCellHeight, shortCellHeight))
    expect(rowHeight).toBeGreaterThan(shortCellHeight)
  })

  it('handles multiple rows independently', () => {
    const columns: Column[] = [{ key: 'a', header: 'A', width: 80 }]
    const rows: TableRow[] = [
      { id: 'r1', a: 'One line' },
      {
        id: 'r2',
        a: 'A much longer piece of text that will definitely wrap when rendered in a narrow column.',
      },
    ]

    const heights = measureRowHeights(rows, columns)
    expect(heights[1]).toBeGreaterThan(heights[0]!)
  })

  it('falls back to width 100 when column has no explicit width', () => {
    const columns: Column[] = [
      { key: 'a', header: 'A', width: 200 },
      { key: 'b', header: 'B' },   // no width — falls back to 100
      { key: 'c', header: 'C' },
    ]
    const rows: TableRow[] = [{ id: 'r1', a: 'A', b: 'B', c: 'C' }]

    expect(() => measureRowHeights(rows, columns)).not.toThrow()
    const [height] = measureRowHeights(rows, columns)
    expect(height).toBeGreaterThanOrEqual(LINE_HEIGHT)
  })

  it('returns an empty array when rows is empty', () => {
    const columns: Column[] = [
      { key: 'a', header: 'A', width: 200 },
      { key: 'b', header: 'B', width: 200 },
    ]
    const heights = measureRowHeights([], columns)
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

    const columns: Column[] = [
      { key: 'a', header: 'A', width: 200 },
      { key: 'b', header: 'B', width: 200 },
    ]
    const rows: TableRow[] = [
      { id: 'r1', a: 'Hello', b: 'World' },
      { id: 'r2', a: 'Foo', b: 'Bar' },
    ]
    expect(() => measureRowHeights(rows, columns)).not.toThrow()
  })
})
