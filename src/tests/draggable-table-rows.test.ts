import { describe, it, expect } from 'vitest'
import { reorder } from '../shared/hooks/useDraggable.js'

describe('reorder helper', () => {
  it('moves an item forward in the array', () => {
    const order = [0, 1, 2, 3, 4]
    expect(reorder(order, 1, 3)).toEqual([0, 2, 3, 1, 4])
  })

  it('moves an item backward in the array', () => {
    const order = [0, 1, 2, 3, 4]
    expect(reorder(order, 3, 1)).toEqual([0, 3, 1, 2, 4])
  })

  it('moves first item to last', () => {
    const order = [0, 1, 2, 3]
    expect(reorder(order, 0, 3)).toEqual([1, 2, 3, 0])
  })

  it('moves last item to first', () => {
    const order = [0, 1, 2, 3]
    expect(reorder(order, 3, 0)).toEqual([3, 0, 1, 2])
  })

  it('no-op when from === to', () => {
    const order = [0, 1, 2, 3]
    expect(reorder(order, 2, 2)).toEqual([0, 1, 2, 3])
  })

  it('does not mutate the original array', () => {
    const order = [0, 1, 2, 3]
    reorder(order, 0, 2)
    expect(order).toEqual([0, 1, 2, 3])
  })
})

describe('rowOrder index mapping after reorder', () => {
  it('rowOrder[visualIndex] gives correct dataIndex after move', () => {
    // Initial identity mapping: visual matches data
    const initial = [0, 1, 2, 3]

    // Move visual row 0 to position 2
    const after = reorder(initial, 0, 2)
    // Data row 0 is now at visual position 2
    expect(after[2]).toBe(0)
    // Data rows 1 and 2 shifted left
    expect(after[0]).toBe(1)
    expect(after[1]).toBe(2)
    expect(after[3]).toBe(3)
  })

  it('applying reorder twice accumulates correctly', () => {
    let order = [0, 1, 2, 3]
    // Move row 3 to front
    order = reorder(order, 3, 0)
    expect(order).toEqual([3, 0, 1, 2])
    // Move row at visual index 2 (data 1) to back
    order = reorder(order, 2, 3)
    expect(order).toEqual([3, 0, 2, 1])
  })
})
