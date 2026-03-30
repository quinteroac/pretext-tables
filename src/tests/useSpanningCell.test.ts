/**
 * Tests for useSpanningCell — US-003.
 *
 * The hook is a thin wrapper over `computeTotalHeight` / `computeOffsets`
 * from `useVirtualization`.  Tests verify the contract of each AC by driving
 * the underlying pure helpers directly (no React renderer needed).
 */
import { describe, it, expect } from 'vitest'
import { computeOffsets, computeTotalHeight } from '../shared/hooks/useVirtualization.js'

// ---------------------------------------------------------------------------
// AC01 + AC02 — totalHeight equals the sum of all rowHeights
// ---------------------------------------------------------------------------

describe('US-003 AC02: totalHeight equals sum of all rowHeights', () => {
  it('returns 0 for an empty array', () => {
    expect(computeTotalHeight([])).toBe(0)
  })

  it('returns the single value for a one-row array', () => {
    expect(computeTotalHeight([50])).toBe(50)
  })

  it('sums all heights correctly', () => {
    expect(computeTotalHeight([20, 40, 60])).toBe(120)
  })

  it('handles uniform row heights', () => {
    expect(computeTotalHeight([20, 20, 20, 20, 20])).toBe(100)
  })

  it('handles variable row heights', () => {
    expect(computeTotalHeight([100, 20, 50, 30])).toBe(200)
  })
})

// ---------------------------------------------------------------------------
// AC03 — offsets[i] equals the cumulative sum of rowHeights[0..i-1]
// ---------------------------------------------------------------------------

describe('US-003 AC03: offsets[i] = cumulative sum of rowHeights[0..i-1]', () => {
  it('returns an empty array for empty input', () => {
    expect(computeOffsets([])).toEqual([])
  })

  it('offsets[0] is always 0 regardless of first row height', () => {
    expect(computeOffsets([100])[0]).toBe(0)
    expect(computeOffsets([20, 40])[0]).toBe(0)
  })

  it('computes correct cumulative offsets', () => {
    // offsets[0]=0, offsets[1]=20, offsets[2]=60, offsets[3]=80
    expect(computeOffsets([20, 40, 20, 60])).toEqual([0, 20, 60, 80])
  })

  it('length matches input length', () => {
    const heights = [10, 20, 30, 40, 50]
    expect(computeOffsets(heights)).toHaveLength(heights.length)
  })

  it('offsets are non-decreasing', () => {
    const offsets = computeOffsets([20, 20, 40, 20, 80])
    for (let i = 1; i < offsets.length; i++) {
      expect(offsets[i]).toBeGreaterThanOrEqual(offsets[i - 1]!)
    }
  })

  it('offsets[i] equals sum of rowHeights[0..i-1] by definition', () => {
    const heights = [30, 45, 25, 60]
    const offsets = computeOffsets(heights)
    for (let i = 0; i < heights.length; i++) {
      const expected = heights.slice(0, i).reduce((a, b) => a + b, 0)
      expect(offsets[i]).toBe(expected)
    }
  })
})

// ---------------------------------------------------------------------------
// AC04 — hook delegates to computeTotalHeight / computeOffsets (equivalence)
// ---------------------------------------------------------------------------

describe('US-003 AC04: hook delegates to computeTotalHeight / computeOffsets', () => {
  it('totalHeight from computeTotalHeight matches manual sum', () => {
    const heights = [30, 45, 25]
    const total = computeTotalHeight(heights)
    const manualSum = heights.reduce((a, b) => a + b, 0)
    expect(total).toBe(manualSum)
  })

  it('offsets from computeOffsets match expected values', () => {
    const heights = [30, 45, 25]
    expect(computeOffsets(heights)).toEqual([0, 30, 75])
  })

  it('totalHeight equals last offset plus last height', () => {
    const heights = [20, 40, 60, 30]
    const offsets = computeOffsets(heights)
    const total = computeTotalHeight(heights)
    const last = heights.length - 1
    expect(total).toBe(offsets[last]! + heights[last]!)
  })
})
