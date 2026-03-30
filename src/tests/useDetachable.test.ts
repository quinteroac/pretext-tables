/**
 * Tests for US-001 — useDetachable: expand a row into a child table panel.
 *
 * The hook's state transitions are covered by testing the extracted pure
 * `toggleSet` utility directly (same pattern used throughout this suite).
 * Demo structural guarantees are verified via source-level checks.
 */
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { toggleSet } from '../shared/hooks/useDetachable.js'

function readSrc(rel: string): string {
  return readFileSync(fileURLToPath(new URL(rel, import.meta.url)), 'utf8')
}

const hookSrc = readSrc('../shared/hooks/useDetachable.ts')
const indexSrc = readSrc('../shared/hooks/index.ts')
const appSrc = readSrc('../demo/App.tsx')
const cssSrc = readSrc('../demo/demo.css')

// ---------------------------------------------------------------------------
// US-001-AC04: toggle logic — adds/removes from expandedRows
// ---------------------------------------------------------------------------

describe('toggleSet — expand/collapse logic', () => {
  it('adds an id that is not yet in the set', () => {
    const result = toggleSet(new Set<string>(), 'row-1')
    expect(result.has('row-1')).toBe(true)
  })

  it('removes an id that is already in the set', () => {
    const result = toggleSet(new Set(['row-1']), 'row-1')
    expect(result.has('row-1')).toBe(false)
  })

  it('does not mutate the original set', () => {
    const original = new Set(['row-1'])
    toggleSet(original, 'row-1')
    expect(original.has('row-1')).toBe(true)
  })

  it('toggling twice restores the original membership', () => {
    const empty = new Set<string>()
    const after1 = toggleSet(empty, 'row-1')
    const after2 = toggleSet(after1, 'row-1')
    expect(after2.has('row-1')).toBe(false)
  })

  it('toggling different ids are independent', () => {
    let s = new Set<string>()
    s = toggleSet(s, 'row-1')
    s = toggleSet(s, 'row-2')
    expect(s.has('row-1')).toBe(true)
    expect(s.has('row-2')).toBe(true)
    s = toggleSet(s, 'row-1')
    expect(s.has('row-1')).toBe(false)
    expect(s.has('row-2')).toBe(true)
  })

  it('works on a large set without corrupting other entries', () => {
    const ids = Array.from({ length: 20 }, (_, i) => `row-${i}`)
    let s = new Set(ids)
    s = toggleSet(s, 'row-5')
    expect(s.has('row-5')).toBe(false)
    // all other ids remain
    expect(ids.filter((id) => id !== 'row-5').every((id) => s.has(id))).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// US-001-AC01: hook returns the expected shape
// ---------------------------------------------------------------------------

describe('US-001-AC01: useDetachable return signature', () => {
  it('hook source exports expandedRows as a Set', () => {
    expect(hookSrc).toContain('expandedRows')
    expect(hookSrc).toContain('Set<string>')
  })

  it('hook source exports toggle function', () => {
    expect(hookSrc).toContain('toggle')
  })

  it('hook source re-exports getChildRows from options', () => {
    expect(hookSrc).toContain('getChildRows')
  })

  it('UseDetachableResult interface declares all three members', () => {
    expect(hookSrc).toContain('UseDetachableResult')
    expect(hookSrc).toMatch(/expandedRows\s*:\s*Set<string>/)
    expect(hookSrc).toMatch(/toggle\s*:\s*\(rowId: string\) => void/)
    expect(hookSrc).toMatch(/getChildRows\s*:\s*\(row: Row\) => Row\[\]/)
  })
})

// ---------------------------------------------------------------------------
// US-001-AC02: independent useMeasure instances documented in hook source
// ---------------------------------------------------------------------------

describe('US-001-AC02: no shared/recursive measurement', () => {
  it('hook source does not import or call useMeasure (measurement belongs in components)', () => {
    // The hook must not import or call useMeasure — those calls belong in components
    expect(hookSrc).not.toMatch(/^import.*useMeasure/m)
    expect(hookSrc).not.toMatch(/useMeasure\s*\(/)
  })

  it('demo renders DetachableChildPanel with its own useMeasure call', () => {
    // The child panel component must call useMeasure independently
    expect(appSrc).toContain('DetachableChildPanel')
    // Both parent and child have distinct useMeasure calls in the demo
    const measureCallCount = (appSrc.match(/useMeasure\(/g) ?? []).length
    expect(measureCallCount).toBeGreaterThanOrEqual(2)
  })
})

// ---------------------------------------------------------------------------
// US-001-AC03: cells remain typed as string[]
// ---------------------------------------------------------------------------

describe('US-001-AC03: cells typed as string[]', () => {
  it('hook source uses Row type (cells: string[])', () => {
    expect(hookSrc).toContain("import type { Row } from '../types.js'")
  })

  it('hook source does not introduce extra cell type wrappers', () => {
    // No alternative cell typing — cells stay plain string[]
    expect(hookSrc).not.toMatch(/cells\s*:\s*(?!string\[\])/)
  })
})

// ---------------------------------------------------------------------------
// US-001-AC04: toggle adds/removes from expandedRows (structural)
// ---------------------------------------------------------------------------

describe('US-001-AC04: toggle wires into expandedRows state', () => {
  it('hook uses useState for expandedRows', () => {
    expect(hookSrc).toContain('useState<Set<string>>')
  })

  it('toggle calls toggleSet to derive the next Set', () => {
    expect(hookSrc).toContain('toggleSet(prev, rowId)')
  })
})

// ---------------------------------------------------------------------------
// US-001-AC05: demo section exists and shows expand/collapse
// ---------------------------------------------------------------------------

describe('US-001-AC05: demo section', () => {
  it('App.tsx imports useDetachable', () => {
    expect(appSrc).toContain('useDetachable')
  })

  it('DetachableDemo component exists', () => {
    expect(appSrc).toContain('DetachableDemo')
  })

  it('demo section eyebrow mentions nested data / inline child table', () => {
    expect(appSrc).toMatch(/[Nn]ested data/)
    expect(appSrc).toMatch(/[Cc]hild table/)
  })

  it('rows are clickable via toggle()', () => {
    // onClick handlers call toggle()
    expect(appSrc).toMatch(/onClick[^}]+toggle\(/)
  })

  it('child panel is conditionally rendered when row is expanded', () => {
    expect(appSrc).toContain('expandedRows.has(row.id)')
    expect(appSrc).toContain('DetachableChildPanel')
  })

  it('expand/collapse indicator is rendered', () => {
    expect(appSrc).toContain('dt-expand-icon')
  })
})

// ---------------------------------------------------------------------------
// hooks/index.ts barrel export
// ---------------------------------------------------------------------------

describe('hooks index barrel export', () => {
  it('exports useDetachable', () => {
    expect(indexSrc).toContain("export { useDetachable, toggleSet } from './useDetachable.js'")
  })

  it('exports UseDetachableOptions and UseDetachableResult types', () => {
    expect(indexSrc).toContain('UseDetachableOptions')
    expect(indexSrc).toContain('UseDetachableResult')
  })
})

// ---------------------------------------------------------------------------
// CSS — detachable demo styles exist
// ---------------------------------------------------------------------------

describe('CSS classes for detachable demo', () => {
  it('defines .dt-parent-table', () => {
    expect(cssSrc).toContain('.dt-parent-table')
  })

  it('defines .dt-parent-row with pointer cursor', () => {
    expect(cssSrc).toContain('.dt-parent-row')
    expect(cssSrc).toMatch(/\.dt-parent-row[^{]*\{[^}]*cursor\s*:\s*pointer/)
  })

  it('defines .dt-child-panel', () => {
    expect(cssSrc).toContain('.dt-child-panel')
  })

  it('defines .dt-child-table', () => {
    expect(cssSrc).toContain('.dt-child-table')
  })

  it('defines .dt-expand-icon', () => {
    expect(cssSrc).toContain('.dt-expand-icon')
  })
})
