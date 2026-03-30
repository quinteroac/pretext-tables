/**
 * Tests for useScrollAnchor pure computation utility.
 *
 * US-003: prepend rows without scroll jump.
 *
 * The hook itself is a React hook and requires a browser environment to test
 * fully; we test the exported pure function `computeScrollDelta` here because
 * that is the critical logic that must be correct.
 */
import { describe, it, expect } from 'vitest'
import { computeScrollDelta } from '../shared/hooks/useScrollAnchor.js'

// ---------------------------------------------------------------------------
// computeScrollDelta — AC03, AC04, AC05
// ---------------------------------------------------------------------------

describe('computeScrollDelta', () => {
  // AC03: Scroll correction is computed from pretext offsets (rowHeights[]).
  it('AC03/AC05: sums one inserted row at index 0', () => {
    // After prepending 1 row of height 40, rowHeights = [40, 20, 20]
    const rowHeights = [40, 20, 20]
    expect(computeScrollDelta(rowHeights, 1, 0)).toBe(40)
  })

  it('AC05: sums many inserted rows at index 0', () => {
    // After prepending 3 rows (30, 25, 40), rowHeights = [30, 25, 40, 20, 20]
    const rowHeights = [30, 25, 40, 20, 20]
    expect(computeScrollDelta(rowHeights, 3, 0)).toBe(95)
  })

  it('sums correctly when inserting in the middle (non-zero atIndex)', () => {
    // Inserting 2 rows at index 2: [20, 20, 50, 60, 20]
    const rowHeights = [20, 20, 50, 60, 20]
    expect(computeScrollDelta(rowHeights, 2, 2)).toBe(110)
  })

  it('returns 0 for an empty new rows array', () => {
    const rowHeights = [20, 40, 20]
    expect(computeScrollDelta(rowHeights, 0, 0)).toBe(0)
  })

  it('returns 0 when rowHeights is empty', () => {
    expect(computeScrollDelta([], 3, 0)).toBe(0)
  })

  it('does not read beyond the end of rowHeights', () => {
    // insertedCount > rowHeights.length — should not throw, just sum available
    const rowHeights = [30, 40]
    // atIndex=0, count=5 but only 2 elements exist
    expect(computeScrollDelta(rowHeights, 5, 0)).toBe(70)
  })

  it('handles uniform row heights — 1 row prepended', () => {
    // AC05: single-row prepend
    const heights = Array(10).fill(20) as number[]
    // Prepend 1 uniform row at the top
    const updated = [20, ...heights]
    expect(computeScrollDelta(updated, 1, 0)).toBe(20)
  })

  it('handles uniform row heights — many rows prepended', () => {
    // AC05: multi-row prepend
    const heights = Array(10).fill(20) as number[]
    const newCount = 5
    const updated = [...Array(newCount).fill(20), ...heights] as number[]
    expect(computeScrollDelta(updated, newCount, 0)).toBe(20 * newCount)
  })

  it('atIndex equal to rowHeights.length returns 0 (insert at tail, no delta needed)', () => {
    const rowHeights = [20, 30]
    // Appending at end: visible content above doesn't shift
    expect(computeScrollDelta(rowHeights, 2, 2)).toBe(0)
  })
})

// ---------------------------------------------------------------------------
// API contract — AC01, AC02
// ---------------------------------------------------------------------------

describe('useScrollAnchor exports', () => {
  it('AC01: useScrollAnchor is exported from shared/hooks/index.ts', async () => {
    const mod = await import('../shared/hooks/index.js')
    expect(typeof mod.useScrollAnchor).toBe('function')
  })

  it('AC02: computeScrollDelta is exported from shared/hooks/index.ts', async () => {
    const mod = await import('../shared/hooks/index.js')
    expect(typeof mod.computeScrollDelta).toBe('function')
  })
})
