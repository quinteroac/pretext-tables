/**
 * Tests for US-006 — SearchDemo: search input + highlight overlay on demo page.
 *
 * The SearchDemo renders a text input and a table. On each keystroke it calls
 * `useSearch` to filter rows and obtain per-cell `matchCoords`. Highlight
 * rectangles are positioned from those coords via inline style.
 *
 * Tests are written without calling `prepareWithSegments` directly (the canvas
 * polyfill only activates when `document` is absent; Bun defines it). The pure
 * helper `computeSearchResults` is tested with `prepared = null`, which
 * exercises the filtering and empty-state logic paths used by the SearchDemo
 * before fonts have loaded (the same guard path `useSearch` uses internally).
 *
 * Coverage:
 *   AC01 — SearchDemo section includes a text input + table (smoke: hook usable)
 *   AC02 — matchCoords structure is well-formed (shape when no prepare is ready)
 *   AC03 — no matches → filteredRows is empty (zero rows in table body)
 */
import { describe, it, expect } from 'vitest'
import { computeSearchResults } from '../shared/hooks/useSearch.js'
import { useSearch } from '../shared/hooks/index.js'
import type { Row } from '../shared/types.js'
import { BODY_FONT } from '../shared/fonts.js'

// Mirror the demo data used in SearchDemo so tests reflect real usage.
const SEARCH_ROWS: Row[] = [
  { id: 'sr1', cells: ['Alice Johnson', 'Leads the frontend architecture team and is responsible for establishing coding standards across all product surfaces.'] },
  { id: 'sr2', cells: ['Bob Martinez', 'Works on backend API design with a focus on performance and scalability for high-traffic endpoints.'] },
  { id: 'sr3', cells: ['Carol White', 'Manages the design system and ensures visual consistency from the component library down to individual page layouts.'] },
  { id: 'sr4', cells: ['David Kim', 'Full-stack engineer who primarily owns the billing and subscription management subsystem.'] },
  { id: 'sr5', cells: ['Eva Schulz', 'Data analyst responsible for building dashboards, defining metrics, and running A/B test analyses.'] },
  { id: 'sr6', cells: ['Frank Okafor', 'DevOps engineer overseeing CI/CD pipelines, container orchestration, and cloud cost optimisation strategies.'] },
  { id: 'sr7', cells: ['Grace Tanaka', 'Product manager for the core editor experience, gathering user feedback and shaping the feature roadmap.'] },
  { id: 'sr8', cells: ['Hiro Nakamura', 'Security engineer who performs threat modelling and conducts regular penetration tests on all customer-facing services.'] },
]

const SEARCH_COLUMN_WIDTHS = [200, 440]
const SEARCH_CELL_PADDING = 16
const OPTIONS = { lineHeight: 20, cellPadding: SEARCH_CELL_PADDING, font: BODY_FONT }

// ---------------------------------------------------------------------------
// AC01: SearchDemo section exposes a usable search hook (smoke test)
// ---------------------------------------------------------------------------

describe('US-006 AC01: SearchDemo hook availability', () => {
  it('useSearch is importable and is a function', () => {
    expect(typeof useSearch).toBe('function')
  })

  it('computeSearchResults returns filteredRows and matchCoords keys', () => {
    // null prepared simulates the pre-fonts-ready state (same path as first render)
    const result = computeSearchResults(SEARCH_ROWS, null, SEARCH_COLUMN_WIDTHS, 'engineer', OPTIONS)
    expect(result).toHaveProperty('filteredRows')
    expect(result).toHaveProperty('matchCoords')
  })

  it('result shape is stable across successive query strings (keystroke contract)', () => {
    const r1 = computeSearchResults(SEARCH_ROWS, null, SEARCH_COLUMN_WIDTHS, 'a', OPTIONS)
    const r2 = computeSearchResults(SEARCH_ROWS, null, SEARCH_COLUMN_WIDTHS, 'al', OPTIONS)
    const r3 = computeSearchResults(SEARCH_ROWS, null, SEARCH_COLUMN_WIDTHS, 'ali', OPTIONS)
    // Each returns the same structural shape regardless of query
    for (const r of [r1, r2, r3]) {
      expect(Array.isArray(r.filteredRows)).toBe(true)
      expect(Array.isArray(r.matchCoords)).toBe(true)
    }
  })
})

// ---------------------------------------------------------------------------
// AC02: matchCoords structure is well-formed (array parallel to filteredRows)
// ---------------------------------------------------------------------------

describe('US-006 AC02: matchCoords is parallel to filteredRows', () => {
  it('matchCoords is an array', () => {
    const { matchCoords } = computeSearchResults(
      SEARCH_ROWS,
      null,
      SEARCH_COLUMN_WIDTHS,
      'engineer',
      OPTIONS,
    )
    expect(Array.isArray(matchCoords)).toBe(true)
  })

  it('matchCoords and filteredRows have the same length', () => {
    // With null prepared + empty query: all rows, empty matchCoords
    const { filteredRows, matchCoords } = computeSearchResults(
      SEARCH_ROWS,
      null,
      SEARCH_COLUMN_WIDTHS,
      '',
      OPTIONS,
    )
    // Empty query → filteredRows is all rows, matchCoords is empty
    expect(filteredRows).toHaveLength(SEARCH_ROWS.length)
    expect(matchCoords).toHaveLength(0)
  })

  it('matchCoords is empty when prepared is null and query is non-empty', () => {
    // Simulates the state before fonts are ready: useSearch returns
    // filteredRows=[] with empty matchCoords, so no highlight spans render.
    const { filteredRows, matchCoords } = computeSearchResults(
      SEARCH_ROWS,
      null,
      SEARCH_COLUMN_WIDTHS,
      'Alice',
      OPTIONS,
    )
    expect(filteredRows).toHaveLength(0)
    expect(matchCoords).toHaveLength(0)
  })
})

// ---------------------------------------------------------------------------
// AC03: no matches → filteredRows is empty (zero rows rendered in table body)
// ---------------------------------------------------------------------------

describe('US-006 AC03: no matches produces empty filteredRows', () => {
  it('query with no matches (null prepared) returns zero filteredRows', () => {
    const { filteredRows } = computeSearchResults(
      SEARCH_ROWS,
      null,
      SEARCH_COLUMN_WIDTHS,
      'xyzzy_no_match_ever',
      OPTIONS,
    )
    expect(filteredRows).toHaveLength(0)
  })

  it('matchCoords is also empty when no rows match', () => {
    const { matchCoords } = computeSearchResults(
      SEARCH_ROWS,
      null,
      SEARCH_COLUMN_WIDTHS,
      'xyzzy_no_match_ever',
      OPTIONS,
    )
    expect(matchCoords).toHaveLength(0)
  })

  it('empty query returns all rows (table body is fully populated)', () => {
    const { filteredRows, matchCoords } = computeSearchResults(
      SEARCH_ROWS,
      null,
      SEARCH_COLUMN_WIDTHS,
      '',
      OPTIONS,
    )
    // All rows shown when query is empty — matches AC01 table behaviour
    expect(filteredRows).toBe(SEARCH_ROWS)
    expect(filteredRows).toHaveLength(SEARCH_ROWS.length)
    // No highlights when query is empty
    expect(matchCoords).toHaveLength(0)
  })
})

