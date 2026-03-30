import { test, expect } from 'vitest'
import { reorder } from '../shared/hooks/useDraggable.js'

test('reorder columns: move index 0 to index 2', () => {
  expect(reorder([0, 1, 2], 0, 2)).toEqual([1, 2, 0])
})

test('reorder columns: move index 2 to index 0', () => {
  expect(reorder([0, 1, 2], 2, 0)).toEqual([2, 0, 1])
})

test('reorder columns: no-op when from === to', () => {
  expect(reorder([0, 1, 2], 1, 1)).toEqual([0, 1, 2])
})

test('columnWidths follow column after reorder', () => {
  const columnWidths = [100, 200, 150]
  const columnOrder = reorder([0, 1, 2], 0, 2) // [1, 2, 0]
  const visualWidths = columnOrder.map((i) => columnWidths[i])
  expect(visualWidths).toEqual([200, 150, 100])
})

test('accumulated reorders compose correctly', () => {
  let order = [0, 1, 2, 3]
  order = reorder(order, 0, 3) // [1, 2, 3, 0]
  order = reorder(order, 2, 0) // [3, 1, 2, 0]
  expect(order).toEqual([3, 1, 2, 0])
})
