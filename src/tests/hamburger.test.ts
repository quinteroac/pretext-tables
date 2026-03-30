/**
 * Tests for US-003 — Responsive hamburger menu (mobile).
 *
 * Source-level structural checks following the sidebar.test.ts pattern.
 */
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

function readSrc(rel: string): string {
  return readFileSync(fileURLToPath(new URL(rel, import.meta.url)), 'utf8')
}

const sidebarSrc = readSrc('../demo/Sidebar.tsx')
const cssSrc     = readSrc('../demo/demo.css')

// ---------------------------------------------------------------------------
// US-003-AC01: below 768 px sidebar is hidden by default, hamburger appears
// ---------------------------------------------------------------------------

describe('US-003-AC01: hamburger visible and sidebar hidden below 768px', () => {
  it('CSS shows hamburger button via display:flex inside max-width: 767px media query', () => {
    // Check that within the 767px media query block, .demo-hamburger gets display:flex
    const mobileBlock = cssSrc.split('@media (max-width: 767px)')[1] ?? ''
    expect(mobileBlock).toMatch(/\.demo-hamburger\s*\{[^}]*display\s*:\s*flex/)
  })

  it('hamburger button is display:none by default (wide screens)', () => {
    expect(cssSrc).toMatch(/\.demo-hamburger\s*\{[^}]*display\s*:\s*none/)
  })

  it('sidebar slides off-screen below 767px via translateX(-100%)', () => {
    const mobileBlock = cssSrc.split('@media (max-width: 767px)')[1] ?? ''
    expect(mobileBlock).toMatch(/\.demo-sidebar\s*\{[^}]*transform\s*:\s*translateX\(-100%\)/)
  })

  it('hamburger button is rendered with correct aria attributes in Sidebar.tsx', () => {
    expect(sidebarSrc).toContain('className="demo-hamburger"')
    expect(sidebarSrc).toContain('aria-label="Open navigation"')
    expect(sidebarSrc).toContain('aria-expanded={isOpen}')
    expect(sidebarSrc).toContain('aria-controls="demo-sidebar"')
  })

  it('hamburger button is positioned fixed so it does not overlap the demo header', () => {
    expect(cssSrc).toMatch(/\.demo-hamburger\s*\{[^}]*position\s*:\s*fixed/)
  })
})

// ---------------------------------------------------------------------------
// US-003-AC02: tapping hamburger opens sidebar as overlay/slide-in
// ---------------------------------------------------------------------------

describe('US-003-AC02: hamburger opens sidebar panel', () => {
  it('Sidebar tracks isOpen state', () => {
    expect(sidebarSrc).toContain('useState(false)')
    expect(sidebarSrc).toContain('isOpen')
  })

  it('open() callback sets isOpen to true', () => {
    expect(sidebarSrc).toContain('setIsOpen(true)')
  })

  it('sidebar gets demo-sidebar--open class when isOpen is true', () => {
    expect(sidebarSrc).toContain("demo-sidebar--open")
    expect(sidebarSrc).toContain("isOpen ? ' demo-sidebar--open' : ''")
  })

  it('demo-sidebar--open CSS class restores translateX(0) to show panel', () => {
    expect(cssSrc).toMatch(/\.demo-sidebar--open\s*\{[^}]*transform\s*:\s*translateX\(0\)/)
  })
})

// ---------------------------------------------------------------------------
// US-003-AC03: tapping a link closes the panel
// ---------------------------------------------------------------------------

describe('US-003-AC03: link click closes the panel', () => {
  it('Sidebar links have onClick handler that closes the panel', () => {
    expect(sidebarSrc).toContain('onClick={handleLinkClick}')
  })

  it('handleLinkClick calls setIsOpen(false)', () => {
    expect(sidebarSrc).toContain('setIsOpen(false)')
  })
})

// ---------------------------------------------------------------------------
// US-003-AC04: tapping outside (or close button) closes without navigating
// ---------------------------------------------------------------------------

describe('US-003-AC04: outside tap and close button dismiss the panel', () => {
  it('backdrop element is rendered when isOpen is true', () => {
    expect(sidebarSrc).toContain('className="demo-sidebar-backdrop"')
    expect(sidebarSrc).toContain('aria-hidden="true"')
  })

  it('backdrop onClick calls close()', () => {
    // close() is assigned to backdrop onClick
    expect(sidebarSrc).toMatch(/demo-sidebar-backdrop[\s\S]{0,60}onClick=\{close\}/)
  })

  it('dedicated close button is rendered inside the sidebar', () => {
    expect(sidebarSrc).toContain('className="demo-sidebar__close"')
    expect(sidebarSrc).toContain('aria-label="Close navigation"')
  })

  it('close button onClick calls close()', () => {
    expect(sidebarSrc).toMatch(/demo-sidebar__close[\s\S]{0,100}onClick=\{close\}/)
  })

  it('Escape key closes the panel', () => {
    expect(sidebarSrc).toContain("e.key === 'Escape'")
    expect(sidebarSrc).toContain('close()')
  })
})

// ---------------------------------------------------------------------------
// US-003-AC05: at >= 768px hamburger is hidden, sidebar always visible
// ---------------------------------------------------------------------------

describe('US-003-AC05: wide viewport — hamburger hidden, sidebar visible', () => {
  it('hamburger has display:none as default (outside any media query)', () => {
    // The rule .demo-hamburger { display: none } must exist outside the 767px block
    const upToMobileBreakpoint = cssSrc.split('@media (max-width: 767px)')[0]
    expect(upToMobileBreakpoint).toMatch(/\.demo-hamburger\s*\{[^}]*display\s*:\s*none/)
  })

  it('sidebar does NOT use display:none to hide — transform is used instead', () => {
    // In the 767px media query the sidebar is hidden via transform, not display:none
    const mobileBlock = cssSrc.split('@media (max-width: 767px)')[1] ?? ''
    expect(mobileBlock).not.toMatch(/\.demo-sidebar\s*\{[^}]*display\s*:\s*none/)
  })

  it('body retains padding-left: 220px on wide screens', () => {
    // The default body rule (outside mobile query) has padding-left: 220px
    const beforeMobile = cssSrc.split('@media (max-width: 767px)')[0]
    expect(beforeMobile).toMatch(/body\s*\{[^}]*padding-left\s*:\s*220px/)
  })
})

// ---------------------------------------------------------------------------
// US-003-AC06: source quality guards (typecheck / lint)
// ---------------------------------------------------------------------------

describe('US-003-AC06: source quality guards', () => {
  it('Sidebar does not import pretext directly', () => {
    expect(sidebarSrc).not.toContain('@chenglou/pretext')
  })

  it('Sidebar uses no inline font strings', () => {
    expect(sidebarSrc).not.toMatch(/\d+px\s+["']?(?:Inter|Syne|JetBrains)/)
  })

  it('useState is imported from react in Sidebar', () => {
    expect(sidebarSrc).toContain('useState')
    expect(sidebarSrc).toContain("from 'react'")
  })
})
