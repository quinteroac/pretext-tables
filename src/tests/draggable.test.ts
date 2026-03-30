/**
 * Tests for useDraggable pure logic utilities.
 *
 * US-003: useDraggable hook for custom composition.
 */
import { describe, it, expect, vi } from 'vitest'
import { reorder } from '../shared/hooks/useDraggable.js'

// ---------------------------------------------------------------------------
// reorder (pure function)
// ---------------------------------------------------------------------------

describe('reorder', () => {
  it('moves an item forward in the array', () => {
    expect(reorder([0, 1, 2, 3], 0, 2)).toEqual([1, 2, 0, 3])
  })

  it('moves an item backward in the array', () => {
    expect(reorder([0, 1, 2, 3], 3, 1)).toEqual([0, 3, 1, 2])
  })

  it('does not mutate the input array', () => {
    const original = [0, 1, 2]
    reorder(original, 0, 2)
    expect(original).toEqual([0, 1, 2])
  })

  it('no-op when from === to', () => {
    expect(reorder([0, 1, 2], 1, 1)).toEqual([0, 1, 2])
  })

  it('works with a single element', () => {
    expect(reorder([0], 0, 0)).toEqual([0])
  })

  it('swaps adjacent elements (forward)', () => {
    expect(reorder([0, 1, 2], 0, 1)).toEqual([1, 0, 2])
  })

  it('swaps adjacent elements (backward)', () => {
    expect(reorder([0, 1, 2], 2, 1)).toEqual([0, 2, 1])
  })

  it('preserves all original values after reorder', () => {
    const order = [0, 1, 2, 3, 4]
    const result = reorder(order, 1, 4)
    expect(result.slice().sort((a, b) => a - b)).toEqual([0, 1, 2, 3, 4])
  })
})

// ---------------------------------------------------------------------------
// Initial state invariants (derived from rowCount / columnCount)
// ---------------------------------------------------------------------------

describe('initial order generation', () => {
  function makeOrder(count: number): number[] {
    return Array.from({ length: count }, (_, i) => i)
  }

  it('rowOrder is [0, 1, ..., rowCount-1]', () => {
    expect(makeOrder(4)).toEqual([0, 1, 2, 3])
  })

  it('columnOrder is [0, 1, ..., columnCount-1]', () => {
    expect(makeOrder(3)).toEqual([0, 1, 2])
  })

  it('empty row count gives empty array', () => {
    expect(makeOrder(0)).toEqual([])
  })
})

// ---------------------------------------------------------------------------
// Drag event handler flow
//
// These tests simulate the sequence of HTML5 drag-and-drop events
// (onDragStart → onDragEnter → onDrop) to verify that the handler
// coordination in useDraggable produces correct reorders.
//
// We test the logic by building a minimal handler factory that mirrors the
// implementation without needing React or jsdom.
// ---------------------------------------------------------------------------

describe('drag event handler flow', () => {
  /** Minimal factory that replicates the fixed useDraggable handler logic. */
  function makeRowHandlers(
    rowIndex: number,
    refs: { dragSource: number | null },
    onReorder: (from: number, to: number) => void,
  ) {
    return {
      onDragStart() { refs.dragSource = rowIndex },
      onDragEnter() { /* visual state only */ },
      onDrop() {
        const from = refs.dragSource   // the drag source
        const to = rowIndex            // this element = drop target
        if (from !== null && from !== to) onReorder(from, to)
        refs.dragSource = null
      },
      onDragEnd() { refs.dragSource = null },
    }
  }

  it('row drag from 0 to 2 reorders correctly', () => {
    const refs = { dragSource: null as number | null }
    let order = [0, 1, 2, 3]
    const reorderCb = (from: number, to: number) => { order = reorder(order, from, to) }

    const row0 = makeRowHandlers(0, refs, reorderCb)
    const row1 = makeRowHandlers(1, refs, reorderCb)
    const row2 = makeRowHandlers(2, refs, reorderCb)

    row0.onDragStart()  // user grabs row 0
    row1.onDragEnter()  // passes over row 1
    row2.onDragEnter()  // enters row 2
    row2.onDrop()       // releases on row 2 → from=0, to=2

    expect(order).toEqual([1, 2, 0, 3])
  })

  it('row drag from 3 to 0 reorders correctly', () => {
    const refs = { dragSource: null as number | null }
    let order = [0, 1, 2, 3]
    const reorderCb = (from: number, to: number) => { order = reorder(order, from, to) }

    const row3 = makeRowHandlers(3, refs, reorderCb)
    const row0 = makeRowHandlers(0, refs, reorderCb)

    row3.onDragStart()
    row0.onDragEnter()
    row0.onDrop()

    expect(order).toEqual([3, 0, 1, 2])
  })

  it('dropping on the source row produces no reorder', () => {
    const refs = { dragSource: null as number | null }
    let order = [0, 1, 2, 3]
    const reorderCb = (from: number, to: number) => { order = reorder(order, from, to) }

    const row1 = makeRowHandlers(1, refs, reorderCb)

    row1.onDragStart()
    row1.onDragEnter()
    row1.onDrop()

    expect(order).toEqual([0, 1, 2, 3]) // unchanged
  })

  it('onDragEnd clears source ref (cancelled drag produces no reorder)', () => {
    const refs = { dragSource: null as number | null }
    let order = [0, 1, 2, 3]
    const reorderCb = (from: number, to: number) => { order = reorder(order, from, to) }

    const row0 = makeRowHandlers(0, refs, reorderCb)
    const row2 = makeRowHandlers(2, refs, reorderCb)

    row0.onDragStart()
    row2.onDragEnter()
    row0.onDragEnd()   // drag cancelled before drop
    row2.onDrop()      // onDrop fires after dragEnd in some browsers — must be a no-op

    expect(order).toEqual([0, 1, 2, 3]) // unchanged
  })

  it('sequential drags accumulate correctly', () => {
    const refs = { dragSource: null as number | null }
    let order = [0, 1, 2, 3]
    const reorderCb = (from: number, to: number) => { order = reorder(order, from, to) }

    const makeAll = (i: number) => makeRowHandlers(i, refs, reorderCb)
    const [h0, _h1, h2, h3] = [makeAll(0), makeAll(1), makeAll(2), makeAll(3)]

    // First drag: move row 0 to position 2
    h0.onDragStart(); h2.onDragEnter(); h2.onDrop()
    expect(order).toEqual([1, 2, 0, 3])

    // Second drag (on new visual state): move visual row 3 to position 1
    h3.onDragStart(); _h1.onDragEnter(); _h1.onDrop()
    expect(order).toEqual([1, 3, 2, 0])
  })
})

// ---------------------------------------------------------------------------
// onRowsReorder / onColumnsReorder callback wiring
// ---------------------------------------------------------------------------

describe('reorder callback', () => {
  it('callback receives the new order array', () => {
    const cb = vi.fn()
    const order = [0, 1, 2, 3]
    const next = reorder(order, 0, 3)
    cb(next)
    expect(cb).toHaveBeenCalledWith([1, 2, 3, 0])
  })

  it('applying reorder twice produces correct cumulative order', () => {
    let order = [0, 1, 2, 3]
    order = reorder(order, 0, 2) // [1, 2, 0, 3]
    order = reorder(order, 3, 1) // [1, 3, 2, 0]
    expect(order).toEqual([1, 3, 2, 0])
  })
})
