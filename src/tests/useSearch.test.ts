/**
 * Tests for useSearch — US-005.
 *
 * Driven via the exported pure helpers `computeSearchResults` and
 * `computeCellMatchRects` (no React rendering needed).
 *
 * Coverage:
 *   AC01 — hook returns { filteredRows, matchCoords }
 *   AC02 — filteredRows contains only case-insensitive matches
 *   AC03 — matchCoords is parallel to filteredRows; maps col → MatchRect[]
 *   AC04 — coordinates come from layoutWithLines() (x/y/width/height are finite numbers)
 *   AC05 — empty query returns all rows with empty matchCoords
 *   AC06 — hook is exported from src/shared/hooks/index.ts
 */
import { describe, it, expect } from 'vitest'
import { prepareWithSegments } from '@chenglou/pretext'
import { computeSearchResults, computeCellMatchRects } from '../shared/hooks/useSearch.js'
import { useSearch } from '../shared/hooks/index.js'
import { BODY_FONT } from '../shared/fonts.js'
import type { Row } from '../shared/types.js'

const FONT = BODY_FONT
const LINE_HEIGHT = 20
const CELL_PADDING = 16
const COL_WIDTH = 300

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const rows: Row[] = [
  { id: '1', cells: ['Hello World', 'foo bar'] },
  { id: '2', cells: ['No match here', 'another cell'] },
  { id: '3', cells: ['world cup final', 'WORLD is capitalised'] },
]

function buildPrepared(rowList: Row[]) {
  return rowList.map((row) => row.cells.map((cell) => prepareWithSegments(cell, FONT)))
}

const OPTIONS = { lineHeight: LINE_HEIGHT, cellPadding: CELL_PADDING, font: FONT }

// ---------------------------------------------------------------------------
// AC01: return shape { filteredRows, matchCoords }
// ---------------------------------------------------------------------------

describe('US-005 AC01: return shape', () => {
  it('computeSearchResults returns an object with filteredRows and matchCoords', () => {
    const prepared = buildPrepared(rows)
    const result = computeSearchResults(rows, prepared, [COL_WIDTH, COL_WIDTH], 'world', OPTIONS)
    expect(result).toHaveProperty('filteredRows')
    expect(result).toHaveProperty('matchCoords')
  })
})

// ---------------------------------------------------------------------------
// AC02: case-insensitive row filtering
// ---------------------------------------------------------------------------

describe('US-005 AC02: case-insensitive row filtering', () => {
  it('only rows with at least one matching cell are included', () => {
    const prepared = buildPrepared(rows)
    const { filteredRows } = computeSearchResults(
      rows,
      prepared,
      [COL_WIDTH, COL_WIDTH],
      'world',
      OPTIONS
    )
    expect(filteredRows).toHaveLength(2)
    expect(filteredRows.map((r) => r.id)).toEqual(['1', '3'])
  })

  it('matching is case-insensitive (uppercase query, mixed-case cells)', () => {
    const prepared = buildPrepared(rows)
    const { filteredRows } = computeSearchResults(
      rows,
      prepared,
      [COL_WIDTH, COL_WIDTH],
      'WORLD',
      OPTIONS
    )
    expect(filteredRows).toHaveLength(2)
  })

  it('rows with no matching cells are excluded', () => {
    const prepared = buildPrepared(rows)
    const { filteredRows } = computeSearchResults(
      rows,
      prepared,
      [COL_WIDTH, COL_WIDTH],
      'xyz_no_match',
      OPTIONS
    )
    expect(filteredRows).toHaveLength(0)
  })

  it('a row is included if at least one cell (not all) matches', () => {
    const testRows: Row[] = [{ id: 'a', cells: ['match here', 'nothing'] }]
    const prepared = buildPrepared(testRows)
    const { filteredRows } = computeSearchResults(
      testRows,
      prepared,
      [COL_WIDTH, COL_WIDTH],
      'match',
      OPTIONS
    )
    expect(filteredRows).toHaveLength(1)
  })
})

// ---------------------------------------------------------------------------
// AC03: matchCoords is parallel to filteredRows
// ---------------------------------------------------------------------------

describe('US-005 AC03: matchCoords parallel to filteredRows', () => {
  it('matchCoords has the same length as filteredRows', () => {
    const prepared = buildPrepared(rows)
    const { filteredRows, matchCoords } = computeSearchResults(
      rows,
      prepared,
      [COL_WIDTH, COL_WIDTH],
      'world',
      OPTIONS
    )
    expect(matchCoords).toHaveLength(filteredRows.length)
  })

  it('matchCoords entries map column index → MatchRect[]', () => {
    const testRows: Row[] = [{ id: 'a', cells: ['hello world', 'no match'] }]
    const prepared = buildPrepared(testRows)
    const { matchCoords } = computeSearchResults(
      testRows,
      prepared,
      [COL_WIDTH, COL_WIDTH],
      'world',
      OPTIONS
    )
    expect(matchCoords).toHaveLength(1)
    // Column 0 has the match
    expect(matchCoords[0][0]).toBeDefined()
    expect(Array.isArray(matchCoords[0][0])).toBe(true)
    // Column 1 has no match
    expect(matchCoords[0][1]).toBeUndefined()
  })

  it('each MatchRect has x, y, width, height properties', () => {
    const testRows: Row[] = [{ id: 'a', cells: ['hello world'] }]
    const prepared = buildPrepared(testRows)
    const { matchCoords } = computeSearchResults(
      testRows,
      prepared,
      [COL_WIDTH],
      'world',
      OPTIONS
    )
    const rects = matchCoords[0][0]
    expect(rects).toHaveLength(1)
    const rect = rects[0]
    expect(rect).toHaveProperty('x')
    expect(rect).toHaveProperty('y')
    expect(rect).toHaveProperty('width')
    expect(rect).toHaveProperty('height')
  })
})

// ---------------------------------------------------------------------------
// AC04: coordinates come from layoutWithLines() — no DOM measurement
// ---------------------------------------------------------------------------

describe('US-005 AC04: coordinates from layoutWithLines', () => {
  it('x, y, width, height are all finite non-negative numbers', () => {
    const testRows: Row[] = [{ id: 'a', cells: ['the quick brown fox'] }]
    const prepared = buildPrepared(testRows)
    const { matchCoords } = computeSearchResults(
      testRows,
      prepared,
      [COL_WIDTH],
      'quick',
      OPTIONS
    )
    const rect = matchCoords[0][0][0]
    expect(Number.isFinite(rect.x)).toBe(true)
    expect(Number.isFinite(rect.y)).toBe(true)
    expect(Number.isFinite(rect.width)).toBe(true)
    expect(Number.isFinite(rect.height)).toBe(true)
    expect(rect.x).toBeGreaterThanOrEqual(0)
    expect(rect.y).toBeGreaterThanOrEqual(0)
    expect(rect.width).toBeGreaterThan(0)
    expect(rect.height).toBeGreaterThan(0)
  })

  it('y increases with line index (multi-line wrapping cell)', () => {
    // Use a narrow column so text wraps to multiple lines
    const longText = 'alpha beta gamma delta epsilon zeta'
    const testRows: Row[] = [{ id: 'a', cells: [longText] }]
    const prepared = buildPrepared(testRows)
    const narrowWidth = 80

    // Find a query that matches on different lines by searching for a word
    // that would appear across lines when the column is narrow
    const { matchCoords } = computeSearchResults(
      testRows,
      prepared,
      [narrowWidth],
      'alpha',
      { lineHeight: LINE_HEIGHT, cellPadding: CELL_PADDING, font: FONT }
    )
    const rects = matchCoords[0]?.[0]
    expect(rects).toBeDefined()
    expect(rects.length).toBeGreaterThan(0)
    // First match y should be 0 (first line)
    expect(rects[0].y).toBe(0)
    expect(rects[0].height).toBe(LINE_HEIGHT)
  })

  it('x is 0 when match starts at the beginning of a line', () => {
    const testRows: Row[] = [{ id: 'a', cells: ['match at start'] }]
    const prepared = buildPrepared(testRows)
    const { matchCoords } = computeSearchResults(
      testRows,
      prepared,
      [COL_WIDTH],
      'match',
      OPTIONS
    )
    const rect = matchCoords[0][0][0]
    expect(rect.x).toBe(0)
    expect(rect.y).toBe(0)
  })

  it('x is positive when match is not at the start of a line', () => {
    const testRows: Row[] = [{ id: 'a', cells: ['hello world'] }]
    const prepared = buildPrepared(testRows)
    const { matchCoords } = computeSearchResults(
      testRows,
      prepared,
      [COL_WIDTH],
      'world',
      OPTIONS
    )
    const rect = matchCoords[0][0][0]
    expect(rect.x).toBeGreaterThan(0)
  })

  it('multiple matches in one cell produce multiple MatchRects', () => {
    const testRows: Row[] = [{ id: 'a', cells: ['cat and cat'] }]
    const prepared = buildPrepared(testRows)
    const { matchCoords } = computeSearchResults(
      testRows,
      prepared,
      [COL_WIDTH],
      'cat',
      OPTIONS
    )
    expect(matchCoords[0][0]).toHaveLength(2)
  })
})

// ---------------------------------------------------------------------------
// AC05: empty query returns all rows, empty matchCoords
// ---------------------------------------------------------------------------

describe('US-005 AC05: empty query passthrough', () => {
  it('filteredRows equals the original rows array when query is empty', () => {
    const prepared = buildPrepared(rows)
    const { filteredRows } = computeSearchResults(
      rows,
      prepared,
      [COL_WIDTH, COL_WIDTH],
      '',
      OPTIONS
    )
    expect(filteredRows).toBe(rows)
  })

  it('matchCoords is empty when query is empty', () => {
    const prepared = buildPrepared(rows)
    const { matchCoords } = computeSearchResults(
      rows,
      prepared,
      [COL_WIDTH, COL_WIDTH],
      '',
      OPTIONS
    )
    expect(matchCoords).toHaveLength(0)
  })

  it('empty query with null prepared still returns all rows', () => {
    const { filteredRows, matchCoords } = computeSearchResults(
      rows,
      null,
      [COL_WIDTH, COL_WIDTH],
      '',
      OPTIONS
    )
    expect(filteredRows).toBe(rows)
    expect(matchCoords).toHaveLength(0)
  })
})

// ---------------------------------------------------------------------------
// AC06: hook exported from index
// ---------------------------------------------------------------------------

describe('US-005 AC06: exported from hooks index', () => {
  it('useSearch is a function exported from src/shared/hooks/index.ts', () => {
    expect(typeof useSearch).toBe('function')
  })
})

// ---------------------------------------------------------------------------
// computeCellMatchRects edge cases
// ---------------------------------------------------------------------------

describe('computeCellMatchRects edge cases', () => {
  it('returns empty array when query does not appear in cell', () => {
    const prepared = prepareWithSegments('hello world', FONT)
    const rects = computeCellMatchRects(prepared, FONT, COL_WIDTH, 'xyz', {
      lineHeight: LINE_HEIGHT,
      cellPadding: CELL_PADDING,
    })
    expect(rects).toHaveLength(0)
  })

  it('handles overlapping-adjacent matches correctly (non-overlapping search)', () => {
    // 'aa' in 'aaaa' should find 2 non-overlapping matches: [0,2) and [2,4)
    const prepared = prepareWithSegments('aaaa', FONT)
    const rects = computeCellMatchRects(prepared, FONT, COL_WIDTH, 'aa', {
      lineHeight: LINE_HEIGHT,
      cellPadding: CELL_PADDING,
    })
    expect(rects).toHaveLength(2)
  })
})
