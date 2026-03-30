/**
 * Tests for US-001 — Fixed sidebar with anchor links.
 *
 * Uses source-level checks (readFileSync) to verify structural guarantees —
 * the same pattern used throughout this test suite.
 */
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { DEMO_SECTIONS } from '../demo/Sidebar.js'

function readSrc(rel: string): string {
  return readFileSync(fileURLToPath(new URL(rel, import.meta.url)), 'utf8')
}

const appSrc   = readSrc('../demo/App.tsx')
const cssSrc   = readSrc('../demo/demo.css')
const sidebarSrc = readSrc('../demo/Sidebar.tsx')

// ---------------------------------------------------------------------------
// US-001-AC01: sidebar is rendered fixed to the left
// ---------------------------------------------------------------------------

describe('US-001-AC01: sidebar is fixed to the left', () => {
  it('Sidebar component is imported and used in App.tsx', () => {
    expect(appSrc).toContain("import { Sidebar }")
    expect(appSrc).toContain('<Sidebar />')
  })

  it('demo-sidebar CSS class has position: fixed', () => {
    expect(cssSrc).toMatch(/\.demo-sidebar\s*\{[^}]*position\s*:\s*fixed/)
  })

  it('demo-sidebar is anchored to left: 0', () => {
    expect(cssSrc).toMatch(/\.demo-sidebar\s*\{[^}]*left\s*:\s*0/)
  })

  it('demo-sidebar spans full viewport height', () => {
    expect(cssSrc).toMatch(/\.demo-sidebar\s*\{[^}]*height\s*:\s*100vh/)
  })
})

// ---------------------------------------------------------------------------
// US-001-AC02: sidebar contains one link per demo section (~20)
// ---------------------------------------------------------------------------

describe('US-001-AC02: sidebar has one link per demo section', () => {
  it('DEMO_SECTIONS has 20 entries', () => {
    expect(DEMO_SECTIONS).toHaveLength(20)
  })

  it('every entry has a non-empty id and label', () => {
    for (const { id, label } of DEMO_SECTIONS) {
      expect(id.length).toBeGreaterThan(0)
      expect(label.length).toBeGreaterThan(0)
    }
  })

  it('sidebar renders an anchor link for each section via dynamic map', () => {
    // Links are generated dynamically; verify the template literal pattern exists
    expect(sidebarSrc).toContain('href={`#${id}`}')
  })

  it('expected section labels are present', () => {
    const labels = DEMO_SECTIONS.map(s => s.label)
    expect(labels).toContain('useMeasure')
    expect(labels).toContain('GridTable')
    expect(labels).toContain('useColumnControls + useStickyColumns')
    expect(labels).toContain('useExportCanvas')
  })
})

// ---------------------------------------------------------------------------
// US-001-AC03: smooth scroll is enabled
// ---------------------------------------------------------------------------

describe('US-001-AC03: smooth scroll on anchor navigation', () => {
  it('html element has scroll-behavior: smooth in CSS', () => {
    expect(cssSrc).toMatch(/html\s*\{[^}]*scroll-behavior\s*:\s*smooth/)
  })
})

// ---------------------------------------------------------------------------
// US-001-AC04: every demo section has a stable id
// ---------------------------------------------------------------------------

describe('US-001-AC04: every demo section has a stable id attribute', () => {
  it('all 20 demo sections have id attributes in App.tsx', () => {
    const total  = (appSrc.match(/className="demo-section"/g) ?? []).length
    const withId = (appSrc.match(/className="demo-section" id=/g) ?? []).length
    expect(total).toBe(20)
    expect(withId).toBe(20)
  })

  it('each DEMO_SECTIONS id appears as a section id in App.tsx', () => {
    for (const { id } of DEMO_SECTIONS) {
      expect(appSrc).toContain(`id="${id}"`)
    }
  })
})

// ---------------------------------------------------------------------------
// US-001-AC05: main content is not obscured by the sidebar
// ---------------------------------------------------------------------------

describe('US-001-AC05: main content offset accounts for sidebar', () => {
  it('body has padding-left to offset sidebar width', () => {
    expect(cssSrc).toMatch(/body\s*\{[^}]*padding-left\s*:\s*220px/)
  })

  it('demo-sidebar has an explicit width matching the body offset', () => {
    expect(cssSrc).toMatch(/\.demo-sidebar\s*\{[^}]*width\s*:\s*220px/)
  })
})

// ---------------------------------------------------------------------------
// US-001-AC06: no forbidden patterns
// ---------------------------------------------------------------------------

describe('US-001-AC06: source quality guards', () => {
  it('Sidebar does not import pretext directly', () => {
    expect(sidebarSrc).not.toContain('@chenglou/pretext')
  })

  it('Sidebar uses no inline font strings', () => {
    // Font strings must come from shared/fonts.ts — sidebar has no text measurement
    expect(sidebarSrc).not.toMatch(/\d+px\s+["']?(?:Inter|Syne|JetBrains)/)
  })
})
