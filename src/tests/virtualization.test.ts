/**
 * Tests for useVirtualization pure computation utilities.
 *
 * US-002: Only visible rows are rendered in the DOM.
 */
import { describe, it, expect } from 'vitest'
import {
  computeOffsets,
  computeTotalHeight,
  computeVirtualWindow,
} from '../shared/hooks/useVirtualization.js'

// ---------------------------------------------------------------------------
// computeOffsets
// ---------------------------------------------------------------------------

describe('computeOffsets', () => {
  it('returns an empty array for empty input', () => {
    expect(computeOffsets([])).toEqual([])
  })

  it('returns [0] for a single row', () => {
    expect(computeOffsets([40])).toEqual([0])
  })

  it('computes correct cumulative offsets', () => {
    // offsets[0]=0, offsets[1]=20, offsets[2]=60, offsets[3]=80
    expect(computeOffsets([20, 40, 20, 60])).toEqual([0, 20, 60, 80])
  })

  it('all offsets are non-decreasing', () => {
    const heights = [20, 20, 40, 20, 80, 20]
    const offsets = computeOffsets(heights)
    for (let i = 1; i < offsets.length; i++) {
      expect(offsets[i]).toBeGreaterThanOrEqual(offsets[i - 1]!)
    }
  })

  it('first offset is always 0', () => {
    expect(computeOffsets([100, 200, 300])[0]).toBe(0)
  })

  it('length matches input length', () => {
    const heights = [10, 20, 30, 40, 50]
    expect(computeOffsets(heights)).toHaveLength(heights.length)
  })
})

// ---------------------------------------------------------------------------
// computeTotalHeight
// ---------------------------------------------------------------------------

describe('computeTotalHeight', () => {
  it('returns 0 for empty input', () => {
    expect(computeTotalHeight([])).toBe(0)
  })

  it('sums all row heights', () => {
    expect(computeTotalHeight([20, 40, 20])).toBe(80)
  })

  it('equals last offset + last height', () => {
    const heights = [20, 40, 60, 30]
    const offsets = computeOffsets(heights)
    const total = computeTotalHeight(heights)
    const last = heights.length - 1
    expect(total).toBe(offsets[last]! + heights[last]!)
  })

  it('is consistent with computeOffsets for a single row', () => {
    expect(computeTotalHeight([99])).toBe(99)
  })
})

// ---------------------------------------------------------------------------
// computeVirtualWindow
// ---------------------------------------------------------------------------

describe('computeVirtualWindow', () => {
  // 5 uniform rows of 20px each; total = 100px
  // offsets = [0, 20, 40, 60, 80]
  const heights = [20, 20, 20, 20, 20]
  const offsets = computeOffsets(heights)

  it('returns endIndex -1 for empty rows', () => {
    const { startIndex, endIndex } = computeVirtualWindow([], [], 0, 100, 0)
    expect(startIndex).toBe(0)
    expect(endIndex).toBe(-1)
  })

  it('returns all rows when viewport covers entire content', () => {
    const { startIndex, endIndex } = computeVirtualWindow(offsets, heights, 0, 200, 0)
    expect(startIndex).toBe(0)
    expect(endIndex).toBe(4)
  })

  it('renders only the first row at scrollTop=0 with a minimal viewport', () => {
    // viewport [0, 20): only row 0 [0, 20) is fully covered
    const { startIndex, endIndex } = computeVirtualWindow(offsets, heights, 0, 20, 0)
    expect(startIndex).toBe(0)
    expect(endIndex).toBe(0)
  })

  it('returns correct range mid-scroll', () => {
    // scrollTop=30, viewportHeight=20 → viewport [30, 50)
    // row 1 [20, 40) partially in view; row 2 [40, 60) partially in view
    const { startIndex, endIndex } = computeVirtualWindow(offsets, heights, 30, 20, 0)
    expect(startIndex).toBeLessThanOrEqual(1)
    expect(endIndex).toBeGreaterThanOrEqual(2)
  })

  it('applies overscan above and below the visible range', () => {
    // scrollTop=40, viewport=20 → visible: rows 1–2 (with conservative boundary)
    const noOverscan = computeVirtualWindow(offsets, heights, 40, 20, 0)
    const withOverscan = computeVirtualWindow(offsets, heights, 40, 20, 2)
    expect(withOverscan.startIndex).toBeLessThanOrEqual(noOverscan.startIndex)
    expect(withOverscan.endIndex).toBeGreaterThanOrEqual(noOverscan.endIndex)
    // With overscan=2: startIndex = max(firstVisible - 2, 0), endIndex = min(lastVisible + 2, 4)
    expect(withOverscan.startIndex).toBe(0)
    expect(withOverscan.endIndex).toBe(4)
  })

  it('never returns startIndex < 0', () => {
    const { startIndex } = computeVirtualWindow(offsets, heights, 0, 20, 10)
    expect(startIndex).toBeGreaterThanOrEqual(0)
  })

  it('never returns endIndex >= row count', () => {
    const { endIndex } = computeVirtualWindow(offsets, heights, 0, 1000, 10)
    expect(endIndex).toBeLessThan(heights.length)
  })

  it('startIndex <= endIndex for a visible non-empty dataset', () => {
    const { startIndex, endIndex } = computeVirtualWindow(offsets, heights, 0, 100, 0)
    expect(startIndex).toBeLessThanOrEqual(endIndex)
  })

  it('works correctly at the last row', () => {
    // scrollTop=80, viewport=20 → only row 4 [80, 100) visible
    const { startIndex, endIndex } = computeVirtualWindow(offsets, heights, 80, 20, 0)
    expect(endIndex).toBe(4)
    expect(startIndex).toBeLessThanOrEqual(4)
  })

  it('handles variable row heights correctly', () => {
    // Row 0: 100px, row 1: 20px, row 2: 50px
    // offsets: [0, 100, 120]
    const varHeights = [100, 20, 50]
    const varOffsets = computeOffsets(varHeights)
    // scrollTop=50, viewport=60 → viewport [50, 110)
    // row 0 [0, 100): bottom 100 > 50 ✓
    // row 1 [100, 120): top 100 < 110 ✓
    const { startIndex, endIndex } = computeVirtualWindow(varOffsets, varHeights, 50, 60, 0)
    expect(startIndex).toBeLessThanOrEqual(0)
    expect(endIndex).toBeGreaterThanOrEqual(1)
  })

  it('total rendered rows does not exceed row count', () => {
    const { startIndex, endIndex } = computeVirtualWindow(offsets, heights, 20, 40, 1)
    const rendered = endIndex - startIndex + 1
    expect(rendered).toBeLessThanOrEqual(heights.length)
  })
})
