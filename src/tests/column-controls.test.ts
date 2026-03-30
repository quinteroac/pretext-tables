/**
 * Tests for column visibility logic.
 *
 * US-002: Column Visibility Toggle for ColumnControlsTable.
 *
 * Since the test environment is node (no DOM), we test the pure logic
 * that useColumnControls relies on: visibility arrays, visible indices
 * derivation, and the minimum-1-column enforcement rule.
 */
import { describe, it, expect } from 'vitest'

// ---------------------------------------------------------------------------
// Pure helpers — mirror the logic inside useColumnControls
// ---------------------------------------------------------------------------

/** Build a visibility array from columnCount and a set of hidden indices. */
function buildVisibility(columnCount: number, hidden: Set<number>): boolean[] {
  return Array.from({ length: columnCount }, (_, i) => !hidden.has(i))
}

/** Derive visible column indices from a visibility array. */
function visibleIndices(visibility: boolean[]): number[] {
  return visibility.reduce<number[]>((acc, v, i) => {
    if (v) acc.push(i)
    return acc
  }, [])
}

/** Count visible columns. */
function visibleCount(visibility: boolean[]): number {
  return visibility.filter(Boolean).length
}

/** Can the column at `colIndex` be hidden? Only if it's visible AND not the last. */
function canHide(visibility: boolean[], colIndex: number): boolean {
  return visibility[colIndex] === true && visibleCount(visibility) > 1
}

/** Is the column the last visible one? */
function isLastVisible(visibility: boolean[], colIndex: number): boolean {
  return visibility[colIndex] === true && visibleCount(visibility) === 1
}

/** Toggle a column, enforcing the minimum-1 rule. Returns new hidden set. */
function toggle(hidden: Set<number>, colIndex: number, columnCount: number): Set<number> {
  if (hidden.has(colIndex)) {
    const next = new Set(hidden)
    next.delete(colIndex)
    return next
  }
  const currentVisible = columnCount - hidden.size
  if (currentVisible <= 1) return hidden // no-op
  const next = new Set(hidden)
  next.add(colIndex)
  return next
}

// ---------------------------------------------------------------------------
// Initial state
// ---------------------------------------------------------------------------

describe('column visibility – initial state', () => {
  it('all columns visible by default', () => {
    const vis = buildVisibility(3, new Set())
    expect(vis).toEqual([true, true, true])
    expect(visibleIndices(vis)).toEqual([0, 1, 2])
  })

  it('respects initial hidden set', () => {
    const vis = buildVisibility(3, new Set([1]))
    expect(vis).toEqual([true, false, true])
    expect(visibleIndices(vis)).toEqual([0, 2])
  })
})

// ---------------------------------------------------------------------------
// AC01: Toggle visible/hidden
// ---------------------------------------------------------------------------

describe('column visibility – toggle', () => {
  it('AC01: toggling a visible column hides it', () => {
    let hidden = new Set<number>()
    hidden = toggle(hidden, 1, 3)
    const vis = buildVisibility(3, hidden)
    expect(vis).toEqual([true, false, true])
    expect(visibleIndices(vis)).toEqual([0, 2])
  })

  it('AC01: toggling a hidden column shows it', () => {
    let hidden = new Set([2])
    hidden = toggle(hidden, 2, 3)
    const vis = buildVisibility(3, hidden)
    expect(vis).toEqual([true, true, true])
    expect(visibleIndices(vis)).toEqual([0, 1, 2])
  })

  it('AC01: multiple toggles work correctly', () => {
    let hidden = new Set<number>()
    hidden = toggle(hidden, 0, 4)
    hidden = toggle(hidden, 2, 4)
    const vis = buildVisibility(4, hidden)
    expect(vis).toEqual([false, true, false, true])
    expect(visibleIndices(vis)).toEqual([1, 3])
  })
})

// ---------------------------------------------------------------------------
// AC02: Hidden columns removed from visible indices (useMeasure only sees visible)
// ---------------------------------------------------------------------------

describe('column visibility – visibleIndices for measurement', () => {
  it('AC02: visibleIndices excludes hidden columns', () => {
    const vis = buildVisibility(4, new Set([1, 3]))
    expect(visibleIndices(vis)).toEqual([0, 2])
  })

  it('AC02: hiding then showing updates visibleIndices', () => {
    let hidden = new Set<number>()
    hidden = toggle(hidden, 0, 3)
    expect(visibleIndices(buildVisibility(3, hidden))).toEqual([1, 2])
    hidden = toggle(hidden, 0, 3)
    expect(visibleIndices(buildVisibility(3, hidden))).toEqual([0, 1, 2])
  })
})

// ---------------------------------------------------------------------------
// AC04: At least one column must remain visible
// ---------------------------------------------------------------------------

describe('column visibility – minimum 1 visible column', () => {
  it('AC04: cannot hide the last visible column', () => {
    let hidden = new Set([0, 1])
    // Only column 2 is visible
    expect(visibleIndices(buildVisibility(3, hidden))).toEqual([2])
    hidden = toggle(hidden, 2, 3)
    // Still visible — toggle was a no-op (same Set reference)
    const vis = buildVisibility(3, hidden)
    expect(vis).toEqual([false, false, true])
    expect(visibleIndices(vis)).toEqual([2])
  })

  it('AC04: cannot hide last column when all others are already hidden', () => {
    let hidden = new Set<number>()
    hidden = toggle(hidden, 0, 2) // hide col 0
    expect(visibleIndices(buildVisibility(2, hidden))).toEqual([1])
    const before = hidden
    hidden = toggle(hidden, 1, 2) // try to hide col 1 — should be no-op
    expect(hidden).toBe(before) // same reference
    expect(visibleIndices(buildVisibility(2, hidden))).toEqual([1])
  })

  it('AC04: isLastVisible returns true for the sole remaining column', () => {
    const vis = buildVisibility(3, new Set([0, 2]))
    expect(isLastVisible(vis, 0)).toBe(false)
    expect(isLastVisible(vis, 1)).toBe(true)
    expect(isLastVisible(vis, 2)).toBe(false)
  })

  it('AC04: isLastVisible returns false when multiple columns are visible', () => {
    const vis = buildVisibility(3, new Set())
    expect(isLastVisible(vis, 0)).toBe(false)
    expect(isLastVisible(vis, 1)).toBe(false)
    expect(isLastVisible(vis, 2)).toBe(false)
  })

  it('AC04: canHide returns false for the last visible column', () => {
    const vis = buildVisibility(3, new Set([0, 2]))
    expect(canHide(vis, 1)).toBe(false) // last visible
    expect(canHide(vis, 0)).toBe(false) // already hidden
  })

  it('AC04: canHide returns true when multiple columns visible', () => {
    const vis = buildVisibility(3, new Set())
    expect(canHide(vis, 0)).toBe(true)
    expect(canHide(vis, 1)).toBe(true)
    expect(canHide(vis, 2)).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// Edge cases
// ---------------------------------------------------------------------------

describe('column visibility – edge cases', () => {
  it('single column table: that column cannot be hidden', () => {
    const hidden = new Set<number>()
    expect(isLastVisible(buildVisibility(1, hidden), 0)).toBe(true)
    const after = toggle(hidden, 0, 1)
    expect(after).toBe(hidden) // no-op, same reference
    expect(buildVisibility(1, after)).toEqual([true])
  })

  it('re-showing a column after failed hide works', () => {
    let hidden = new Set([0])
    // Try to hide last visible (col 1) — should be no-op
    hidden = toggle(hidden, 1, 2)
    expect(visibleIndices(buildVisibility(2, hidden))).toEqual([1])
    // Show col 0 again
    hidden = toggle(hidden, 0, 2)
    expect(visibleIndices(buildVisibility(2, hidden))).toEqual([0, 1])
  })

  it('toggling same column twice returns to original state', () => {
    let hidden = new Set<number>()
    hidden = toggle(hidden, 1, 3)
    expect(visibleIndices(buildVisibility(3, hidden))).toEqual([0, 2])
    hidden = toggle(hidden, 1, 3)
    expect(visibleIndices(buildVisibility(3, hidden))).toEqual([0, 1, 2])
  })
})
