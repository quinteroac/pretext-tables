/**
 * Tests for useStickyColumns pure logic.
 *
 * US-001: useStickyColumns — frozen left-column pane
 */
import { describe, it, expect } from 'vitest'
import { sliceStickyColumns } from '../shared/hooks/useStickyColumns.js'

describe('sliceStickyColumns', () => {
  // AC01 + AC06 — basic slice with frozenCount=2
  it('AC01/AC06: splits [100,120,80,60] at frozenCount=2', () => {
    const { frozenWidths, scrollWidths } = sliceStickyColumns([100, 120, 80, 60], 2)
    expect(frozenWidths).toEqual([100, 120])
    expect(scrollWidths).toEqual([80, 60])
  })

  // AC01 — lengths
  it('AC01: frozenWidths.length equals frozenCount', () => {
    const { frozenWidths } = sliceStickyColumns([100, 120, 80, 60], 2)
    expect(frozenWidths).toHaveLength(2)
  })

  // AC01 — concat restores original array
  it('AC01: frozenWidths.concat(scrollWidths) equals original columnWidths', () => {
    const widths = [100, 120, 80, 60]
    const { frozenWidths, scrollWidths } = sliceStickyColumns(widths, 2)
    expect([...frozenWidths, ...scrollWidths]).toEqual(widths)
  })

  // AC03 — different frozenCount values re-slice correctly (runtime change simulation)
  it('AC03: frozenCount=1 re-slices correctly', () => {
    const widths = [100, 120, 80, 60]
    const { frozenWidths, scrollWidths } = sliceStickyColumns(widths, 1)
    expect(frozenWidths).toEqual([100])
    expect(scrollWidths).toEqual([120, 80, 60])
  })

  it('AC03: frozenCount=3 re-slices correctly', () => {
    const widths = [100, 120, 80, 60]
    const { frozenWidths, scrollWidths } = sliceStickyColumns(widths, 3)
    expect(frozenWidths).toEqual([100, 120, 80])
    expect(scrollWidths).toEqual([60])
  })

  // Edge cases
  it('frozenCount=0 yields empty frozenWidths and full scrollWidths', () => {
    const { frozenWidths, scrollWidths } = sliceStickyColumns([100, 120, 80], 0)
    expect(frozenWidths).toEqual([])
    expect(scrollWidths).toEqual([100, 120, 80])
  })

  it('frozenCount equals total columns yields full frozenWidths and empty scrollWidths', () => {
    const { frozenWidths, scrollWidths } = sliceStickyColumns([100, 120, 80], 3)
    expect(frozenWidths).toEqual([100, 120, 80])
    expect(scrollWidths).toEqual([])
  })

  // AC02 — frozenWidths.concat(scrollWidths) is valid flat array for useMeasure
  it('AC02: combined array is suitable as columnWidths for useMeasure', () => {
    const original = [100, 120, 80, 60]
    const { frozenWidths, scrollWidths } = sliceStickyColumns(original, 2)
    const combined = frozenWidths.concat(scrollWidths)
    expect(combined).toEqual(original)
    expect(combined).toHaveLength(original.length)
  })
})
