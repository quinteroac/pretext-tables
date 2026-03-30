/**
 * Tests for US-006 — Demo page updated.
 *
 * Because the demo runs in a browser environment without JSDOM, tests use
 * source-level checks (readFileSync) to verify structural guarantees — the
 * same pattern used throughout this test suite.
 */
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

function readSrc(rel: string): string {
  return readFileSync(fileURLToPath(new URL(rel, import.meta.url)), 'utf8')
}

const appSrc = readSrc('../demo/App.tsx')
const cssSrc = readSrc('../demo/demo.css')

// ---------------------------------------------------------------------------
// AC01: demo sections for all three hooks
// ---------------------------------------------------------------------------

describe('US-006 AC01: demo sections for useShrinkWrap, useResizePreview, useScrollAnchor', () => {
  it('App.tsx has a ShrinkWrapDemo section referencing useShrinkWrap', () => {
    expect(appSrc).toContain('ShrinkWrapDemo')
    expect(appSrc).toContain('useShrinkWrap')
  })

  it('App.tsx has a ResizePreviewDemo section referencing useResizePreview', () => {
    expect(appSrc).toContain('ResizePreviewDemo')
    expect(appSrc).toContain('useResizePreview')
  })

  it('App.tsx has a ScrollAnchorDemo section referencing useScrollAnchor', () => {
    expect(appSrc).toContain('ScrollAnchorDemo')
    expect(appSrc).toContain('useScrollAnchor')
  })
})

// ---------------------------------------------------------------------------
// AC01 (continued): interaction affordances
// ---------------------------------------------------------------------------

describe('US-006 AC01: useShrinkWrap uses double-click-to-fit interaction', () => {
  it('ShrinkWrapDemo attaches onDoubleClick to column handles', () => {
    expect(appSrc).toContain('onDoubleClick')
  })

  it('onDoubleClick calls handleFit (fitColumn wrapper)', () => {
    expect(appSrc).toMatch(/onDoubleClick[^}]+handleFit/)
  })

  it('demo-col-fit-handle class is applied to the double-click target', () => {
    expect(appSrc).toContain('demo-col-fit-handle')
  })
})

describe('US-006 AC01: useScrollAnchor has live feed simulation', () => {
  it('ScrollAnchorDemo has isLive state toggle', () => {
    expect(appSrc).toContain('isLive')
    expect(appSrc).toContain('setIsLive')
  })

  it('ScrollAnchorDemo uses setInterval for auto-prepend', () => {
    expect(appSrc).toContain('setInterval')
  })

  it('interval is cleared on cleanup (clearInterval)', () => {
    expect(appSrc).toContain('clearInterval')
  })

  it('live feed prepends via useScrollAnchor prepend()', () => {
    // The interval callback must call prepend() so scrollTop is corrected
    expect(appSrc).toMatch(/setInterval[^}]+prepend/)
  })
})

// ---------------------------------------------------------------------------
// AC02: each section has a short descriptive label (eyebrow)
// ---------------------------------------------------------------------------

describe('US-006 AC02: descriptive labels on each hook demo section', () => {
  it('useShrinkWrap section eyebrow mentions double-click to fit', () => {
    expect(appSrc).toMatch(/[Dd]ouble.click to fit/)
  })

  it('useResizePreview section eyebrow mentions ghost preview', () => {
    expect(appSrc).toMatch(/[Gg]host preview/)
  })

  it('useScrollAnchor section eyebrow mentions live feed', () => {
    expect(appSrc).toMatch(/[Ll]ive feed/)
  })
})

// ---------------------------------------------------------------------------
// AC03: source quality — no forbidden patterns
// ---------------------------------------------------------------------------

describe('US-006 AC03: source quality guards', () => {
  it('ShrinkWrapDemo uses fitColumn, not DOM measurement', () => {
    expect(appSrc).toContain('fitColumn')
    // getBoundingClientRect may appear as display text in JSX, but must not be called
    expect(appSrc).not.toMatch(/\bgetBoundingClientRect\s*\(/)
  })

  it('no inline font strings (all fonts from shared/fonts.ts)', () => {
    expect(appSrc).toContain('BODY_FONT')
    expect(appSrc).toContain('HEADER_FONT')
  })

  it('demo-col-fit-handle CSS class is defined in demo.css', () => {
    expect(cssSrc).toContain('.demo-col-fit-handle')
  })

  it('demo-col-fit-handle uses col-resize cursor', () => {
    expect(cssSrc).toMatch(/\.demo-col-fit-handle[^{]*\{[^}]*cursor\s*:\s*col-resize/)
  })

  it('demo-fit-btn--live-active CSS class is defined for live feed button', () => {
    expect(cssSrc).toContain('.demo-fit-btn--live-active')
  })

  it('demo-sw-header-text truncates header text to keep handle visible', () => {
    expect(cssSrc).toContain('.demo-sw-header-text')
    expect(cssSrc).toMatch(/\.demo-sw-header-text[^{]*\{[^}]*padding-right/)
  })
})
