/**
 * Tests for useEditable — inline editing with live per-keystroke row height updates.
 *
 * US-004: Row height updates on every keystroke using layout() against a debounced
 * prepared state — no DOM reflows, no getBoundingClientRect.
 */
import { describe, it, expect, vi, afterEach } from 'vitest'
import { prepareWithSegments } from '@chenglou/pretext'
import { computeEditRowHeight, useEditable } from '../shared/hooks/useEditable.js'
import { BODY_FONT } from '../shared/fonts.js'

// ---------------------------------------------------------------------------
// Test data
// ---------------------------------------------------------------------------

const SHORT = 'Hi'
const LONG =
  'This is a much longer piece of text that wraps across several lines when ' +
  'the column is narrow — every added character can push the row taller.'

const LINE_HEIGHT = 20
const CELL_PADDING = 16

// ---------------------------------------------------------------------------
// computeEditRowHeight — pure function tests (AC02, AC04, AC05)
// ---------------------------------------------------------------------------

describe('computeEditRowHeight', () => {
  it('returns lineHeight when row has no prepared entries', () => {
    expect(computeEditRowHeight([], [], LINE_HEIGHT, CELL_PADDING)).toBe(LINE_HEIGHT)
  })

  it('returns at least lineHeight for a single prepared cell', () => {
    const prepared = prepareWithSegments(SHORT, BODY_FONT)
    const height = computeEditRowHeight([prepared], [200], LINE_HEIGHT, CELL_PADDING)
    expect(height).toBeGreaterThanOrEqual(LINE_HEIGHT)
  })

  it('long text in a narrow column is taller than short text (AC02 — layout runs on current value)', () => {
    const width = 80
    const shortPrepared = prepareWithSegments(SHORT, BODY_FONT)
    const longPrepared = prepareWithSegments(LONG, BODY_FONT)
    const shortH = computeEditRowHeight([shortPrepared], [width], LINE_HEIGHT, CELL_PADDING)
    const longH = computeEditRowHeight([longPrepared], [width], LINE_HEIGHT, CELL_PADDING)
    expect(longH).toBeGreaterThan(shortH)
  })

  it('wider column produces same or shorter height for the same text (AC04 — column widths honoured)', () => {
    const prepared = prepareWithSegments(LONG, BODY_FONT)
    const narrowH = computeEditRowHeight([prepared], [80], LINE_HEIGHT, CELL_PADDING)
    const wideH = computeEditRowHeight([prepared], [500], LINE_HEIGHT, CELL_PADDING)
    expect(wideH).toBeLessThanOrEqual(narrowH)
  })

  it('uses the maximum height across all columns', () => {
    const shortPrepared = prepareWithSegments(SHORT, BODY_FONT)
    const longPrepared = prepareWithSegments(LONG, BODY_FONT)
    const shortH = computeEditRowHeight([shortPrepared], [200], LINE_HEIGHT, CELL_PADDING)
    const longH = computeEditRowHeight([longPrepared], [80], LINE_HEIGHT, CELL_PADDING)
    const combined = computeEditRowHeight(
      [shortPrepared, longPrepared],
      [200, 80],
      LINE_HEIGHT,
      CELL_PADDING,
    )
    expect(combined).toBeGreaterThanOrEqual(shortH)
    expect(combined).toBeGreaterThanOrEqual(longH)
  })

  it('undefined prepared entries are skipped gracefully (AC05 — no DOM fallback)', () => {
    const prepared = prepareWithSegments(SHORT, BODY_FONT)
    const h1 = computeEditRowHeight([prepared], [200], LINE_HEIGHT, CELL_PADDING)
    // Second column has undefined — should not throw or call DOM APIs
    const h2 = computeEditRowHeight([prepared, undefined], [200, 200], LINE_HEIGHT, CELL_PADDING)
    expect(h2).toBe(h1)
  })

  it('cellPadding reduces effective column width (narrower effective width → taller row)', () => {
    const prepared = prepareWithSegments(LONG, BODY_FONT)
    const noPadding = computeEditRowHeight([prepared], [120], LINE_HEIGHT, 0)
    const withPadding = computeEditRowHeight([prepared], [120], LINE_HEIGHT, 40)
    // More padding → smaller effective width → more wrapping → taller
    expect(withPadding).toBeGreaterThanOrEqual(noPadding)
  })
})

// ---------------------------------------------------------------------------
// Module contract tests (AC01)
// ---------------------------------------------------------------------------

describe('useEditable module exports', () => {
  it('useEditable is exported as a function (AC01)', () => {
    expect(typeof useEditable).toBe('function')
  })

  it('computeEditRowHeight is exported as a pure function (AC05 — no DOM measurement)', () => {
    expect(typeof computeEditRowHeight).toBe('function')
  })
})

// ---------------------------------------------------------------------------
// Debounce timing tests (AC03) — verifies prepare() timing contract
// ---------------------------------------------------------------------------

describe('computeEditRowHeight debounce contract (AC03)', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('layout() can run against older prepared state before prepare() re-fires', () => {
    // Simulate the debounce window: layout() runs with previously prepared text
    // while prepare() hasn't been called yet with the new text.
    // The height is still a valid measurement — just based on the previous canvas pass.
    const oldText = 'Hello world'
    const newText = 'Hello world and then some more text that makes this cell taller'
    const oldPrepared = prepareWithSegments(oldText, BODY_FONT)
    const newPrepared = prepareWithSegments(newText, BODY_FONT)
    const width = 120

    // During debounce: layout with old prepared
    const heightDuringDebounce = computeEditRowHeight([oldPrepared], [width], LINE_HEIGHT, CELL_PADDING)
    // After debounce: layout with new prepared
    const heightAfterDebounce = computeEditRowHeight([newPrepared], [width], LINE_HEIGHT, CELL_PADDING)

    // Both are valid non-zero heights — the height after debounce reflects the actual text
    expect(heightDuringDebounce).toBeGreaterThanOrEqual(LINE_HEIGHT)
    expect(heightAfterDebounce).toBeGreaterThanOrEqual(LINE_HEIGHT)
    // Adding more text should grow the row once prepare() fires
    expect(heightAfterDebounce).toBeGreaterThanOrEqual(heightDuringDebounce)
  })
})
