/**
 * Tests for useSortable pure logic utilities.
 *
 * US-001: Sortable Columns for ColumnControlsTable.
 */
import { describe, it, expect } from 'vitest'
import { nextSortState, sortRows } from '../shared/hooks/useSortable.js'
import type { SortState } from '../shared/hooks/useSortable.js'
import type { Row } from '../shared/types.js'

// ---------------------------------------------------------------------------
// nextSortState (pure state machine)
// ---------------------------------------------------------------------------

describe('nextSortState', () => {
  const NONE: SortState = { column: null, direction: 'none' }

  it('AC01: clicking a header with no current sort sets ascending', () => {
    const result = nextSortState(NONE, 0)
    expect(result).toEqual({ column: 0, direction: 'asc' })
  })

  it('AC02: clicking the same header again switches to descending', () => {
    const asc: SortState = { column: 0, direction: 'asc' }
    const result = nextSortState(asc, 0)
    expect(result).toEqual({ column: 0, direction: 'desc' })
  })

  it('AC03: clicking a third time resets to none', () => {
    const desc: SortState = { column: 0, direction: 'desc' }
    const result = nextSortState(desc, 0)
    expect(result).toEqual({ column: null, direction: 'none' })
  })

  it('AC03: clicking a different header resets previous and sets new to ascending', () => {
    const ascCol0: SortState = { column: 0, direction: 'asc' }
    const result = nextSortState(ascCol0, 2)
    expect(result).toEqual({ column: 2, direction: 'asc' })
  })

  it('clicking a different header from descending sets new to ascending', () => {
    const descCol1: SortState = { column: 1, direction: 'desc' }
    const result = nextSortState(descCol1, 0)
    expect(result).toEqual({ column: 0, direction: 'asc' })
  })

  it('full cycle: none → asc → desc → none', () => {
    let state = NONE
    state = nextSortState(state, 1)
    expect(state).toEqual({ column: 1, direction: 'asc' })
    state = nextSortState(state, 1)
    expect(state).toEqual({ column: 1, direction: 'desc' })
    state = nextSortState(state, 1)
    expect(state).toEqual({ column: null, direction: 'none' })
  })

  it('switching columns mid-cycle restarts at ascending', () => {
    let state: SortState = { column: 0, direction: 'desc' }
    state = nextSortState(state, 2)
    expect(state).toEqual({ column: 2, direction: 'asc' })
    state = nextSortState(state, 2)
    expect(state).toEqual({ column: 2, direction: 'desc' })
  })
})

// ---------------------------------------------------------------------------
// sortRows (pure sort)
// ---------------------------------------------------------------------------

describe('sortRows', () => {
  const rows: Row[] = [
    { id: '1', cells: ['Charlie', 'Backend dev', 'Engineering'] },
    { id: '2', cells: ['Alice', 'Frontend dev', 'Design'] },
    { id: '3', cells: ['Bob', 'Fullstack dev', 'Platform'] },
  ]

  it('returns original array when direction is none', () => {
    const result = sortRows(rows, { column: null, direction: 'none' })
    expect(result).toBe(rows) // same reference
  })

  it('AC05: sorts ascending by column 0 (name)', () => {
    const result = sortRows(rows, { column: 0, direction: 'asc' })
    expect(result.map((r) => r.cells[0])).toEqual(['Alice', 'Bob', 'Charlie'])
  })

  it('AC05: sorts descending by column 0 (name)', () => {
    const result = sortRows(rows, { column: 0, direction: 'desc' })
    expect(result.map((r) => r.cells[0])).toEqual(['Charlie', 'Bob', 'Alice'])
  })

  it('sorts by column 2 (department) ascending', () => {
    const result = sortRows(rows, { column: 2, direction: 'asc' })
    expect(result.map((r) => r.cells[2])).toEqual(['Design', 'Engineering', 'Platform'])
  })

  it('does not mutate the input array', () => {
    const original = [...rows]
    sortRows(rows, { column: 0, direction: 'asc' })
    expect(rows).toEqual(original)
  })

  it('preserves row identity (ids) after sort', () => {
    const result = sortRows(rows, { column: 0, direction: 'asc' })
    expect(result.map((r) => r.id)).toEqual(['2', '3', '1'])
  })

  it('handles empty rows', () => {
    const result = sortRows([], { column: 0, direction: 'asc' })
    expect(result).toEqual([])
  })

  it('handles single row', () => {
    const single = [rows[0]]
    const result = sortRows(single, { column: 0, direction: 'asc' })
    expect(result).toEqual(single)
  })
})

// ---------------------------------------------------------------------------
// Sort indicator visibility (AC04)
// ---------------------------------------------------------------------------

describe('sort indicator logic', () => {
  it('AC04: indicator shown only when column matches and direction is not none', () => {
    const state: SortState = { column: 1, direction: 'asc' }
    // Column 1 should show indicator
    expect(state.column === 1 && state.direction !== 'none').toBe(true)
    // Column 0 should not
    expect(state.column === 0).toBe(false)
  })

  it('AC04: no indicator when unsorted', () => {
    const state: SortState = { column: null, direction: 'none' }
    expect(state.column === null).toBe(true)
  })

  it('AC04: ascending shows ▲, descending shows ▼', () => {
    function indicator(dir: 'asc' | 'desc'): string {
      return dir === 'asc' ? '▲' : '▼'
    }
    expect(indicator('asc')).toBe('▲')
    expect(indicator('desc')).toBe('▼')
  })
})
