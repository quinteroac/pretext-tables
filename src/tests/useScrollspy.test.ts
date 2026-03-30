/**
 * Tests for US-002 — Scrollspy active section highlight.
 *
 * The IntersectionObserver-driven hook is tested via its extracted pure
 * utility (`pickNearestSection`) and via source-level structural checks,
 * following the pattern established in useDetachable.test.ts.
 */
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { pickNearestSection } from '../shared/hooks/useScrollspy.js'

function readSrc(rel: string): string {
  return readFileSync(fileURLToPath(new URL(rel, import.meta.url)), 'utf8')
}

const hookSrc = readSrc('../shared/hooks/useScrollspy.ts')
const sidebarSrc = readSrc('../demo/Sidebar.tsx')
const cssSrc = readSrc('../demo/demo.css')
const indexSrc = readSrc('../shared/hooks/index.ts')

// ---------------------------------------------------------------------------
// US-002-AC04 / AC02 — pickNearestSection pure logic
// ---------------------------------------------------------------------------

describe('pickNearestSection', () => {
  it('returns null when map is empty (no sections intersecting)', () => {
    // AC04: no active link when nothing intersects
    expect(pickNearestSection(new Map())).toBeNull()
  })

  it('returns the only entry when map has one item', () => {
    // AC02: exactly one active link
    const m = new Map([['intro', 10]])
    expect(pickNearestSection(m)).toBe('intro')
  })

  it('returns the id with the smallest absolute top value', () => {
    // AC01 / AC02: picks section nearest top of viewport
    const m = new Map<string, number>([
      ['far', 500],
      ['near', 30],
      ['middle', 200],
    ])
    expect(pickNearestSection(m)).toBe('near')
  })

  it('handles negative top values (section scrolled above viewport)', () => {
    // Section whose top is -10 is closer to viewport than one at +50
    const m = new Map<string, number>([
      ['above', -10],
      ['below', 50],
    ])
    expect(pickNearestSection(m)).toBe('above')
  })

  it('only one id is returned — never multiple active (AC02)', () => {
    const m = new Map<string, number>([
      ['a', 100],
      ['b', 50],
      ['c', 200],
    ])
    const result = pickNearestSection(m)
    expect(typeof result).toBe('string')
    // result is a single string, not an array
    expect(Array.isArray(result)).toBe(false)
  })

  it('does not mutate the input map', () => {
    const m = new Map([['sec', 5]])
    pickNearestSection(m)
    expect(m.size).toBe(1)
  })
})

// ---------------------------------------------------------------------------
// Source-level structural checks
// ---------------------------------------------------------------------------

describe('useScrollspy — hook structure (AC03)', () => {
  it('uses IntersectionObserver (not getBoundingClientRect or scroll events)', () => {
    expect(hookSrc).toContain('IntersectionObserver')
    expect(hookSrc).not.toContain('getBoundingClientRect()')
    expect(hookSrc).not.toContain("addEventListener('scroll'")
  })

  it('disconnects the observer on cleanup', () => {
    expect(hookSrc).toContain('observer.disconnect()')
  })

  it('exports pickNearestSection as a named export', () => {
    expect(hookSrc).toContain('export function pickNearestSection')
  })
})

describe('Sidebar — active link integration (AC01, AC02)', () => {
  it('imports and calls useScrollspy', () => {
    expect(sidebarSrc).toContain('useScrollspy')
  })

  it('applies --active modifier class to the matching link', () => {
    expect(sidebarSrc).toContain('demo-sidebar__link--active')
  })

  it('uses aria-current="location" on the active link', () => {
    expect(sidebarSrc).toContain("aria-current")
  })
})

describe('CSS active state (AC01)', () => {
  it('defines .demo-sidebar__link--active with accent color', () => {
    expect(cssSrc).toContain('.demo-sidebar__link--active')
    expect(cssSrc).toContain('var(--accent)')
  })

  it('includes a left-border accent on active link', () => {
    expect(cssSrc).toContain('border-left')
  })

  it('uses accent-dim background for active link', () => {
    expect(cssSrc).toContain('var(--accent-dim)')
  })
})

describe('Barrel export (AC05)', () => {
  it('exports useScrollspy from hooks index', () => {
    expect(indexSrc).toContain('useScrollspy')
  })
})
