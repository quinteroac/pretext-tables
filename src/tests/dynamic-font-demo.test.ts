/**
 * Tests for US-002 — DynamicFontDemo: live font-size slider and family selector.
 *
 * Covers:
 *   AC01 — DynamicFontDemo section with range slider (12–32 px) and font-family <select>
 *   AC02 — No getBoundingClientRect or DOM measurement in the demo code path
 *   AC03 — Changing font family triggers debounced setFont() (verified via hook contract)
 *   AC04 — Visual verification (structural checks only — runtime browser test N/A)
 */
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

function readSrc(rel: string): string {
  return readFileSync(fileURLToPath(new URL(rel, import.meta.url)), 'utf8')
}

const appSrc = readSrc('../demo/App.tsx')
const cssSrc = readSrc('../demo/demo.css')
const fontsSrc = readSrc('../shared/fonts.ts')

// ---------------------------------------------------------------------------
// AC01: DynamicFontDemo section exists with slider and family select
// ---------------------------------------------------------------------------

describe('US-002 AC01: DynamicFontDemo section structure', () => {
  it('App.tsx defines a DynamicFontDemo component', () => {
    expect(appSrc).toContain('function DynamicFontDemo')
  })

  it('App.tsx renders <DynamicFontDemo /> in the main return', () => {
    expect(appSrc).toContain('<DynamicFontDemo />')
  })

  it('DynamicFontDemo section includes eyebrow text with "dynamic font"', () => {
    expect(appSrc).toMatch(/[Dd]ynamic font/)
  })

  it('DynamicFontDemo has a range input with min 12', () => {
    expect(appSrc).toContain('min={12}')
  })

  it('DynamicFontDemo has a range input with max 32', () => {
    expect(appSrc).toContain('max={32}')
  })

  it('DynamicFontDemo has a type="range" input (slider)', () => {
    expect(appSrc).toContain('type="range"')
  })

  it('DynamicFontDemo has a <select> element for font family', () => {
    // The select with className demo-df-select or just any select
    expect(appSrc).toContain('demo-df-select')
    expect(appSrc).toMatch(/<select/)
  })

  it('DynamicFontDemo renders font family options from DF_FONT_FAMILIES', () => {
    expect(appSrc).toContain('DF_FONT_FAMILIES')
    expect(appSrc).toContain('<option')
  })

  it('DynamicFontDemo section has h2 title referencing useDynamicFont', () => {
    expect(appSrc).toMatch(/useDynamicFont/)
  })

  it('initial font size is 14px', () => {
    expect(appSrc).toContain('DF_INITIAL_SIZE = 14')
  })
})

// ---------------------------------------------------------------------------
// AC02: No DOM measurement in demo code path
// ---------------------------------------------------------------------------

describe('US-002 AC02: no DOM measurement in demo', () => {
  it('App.tsx does not call getBoundingClientRect()', () => {
    expect(appSrc).not.toMatch(/\bgetBoundingClientRect\s*\(/)
  })

  it('App.tsx does not use offsetHeight for cell sizing', () => {
    // offsetHeight may appear as display text in code snippets only
    // Must not appear as a JS property access call
    expect(appSrc).not.toMatch(/\.offsetHeight\s*[^'"`,]/)
  })

  it('DynamicFontDemo calls setFont() from useDynamicFont (not DOM)', () => {
    expect(appSrc).toContain('setFont(')
  })

  it('DynamicFontDemo uses rowHeights from useDynamicFont', () => {
    expect(appSrc).toContain('rowHeights[rowIndex]')
  })

  it('demo snippet code mentions "No getBoundingClientRect" in the CodeSnippet', () => {
    expect(appSrc).toContain('No getBoundingClientRect')
  })
})

// ---------------------------------------------------------------------------
// AC03: font family changes use debounced setFont()
// ---------------------------------------------------------------------------

describe('US-002 AC03: font family change uses debounced setFont()', () => {
  it('handleFamilyChange calls setFont with the new family', () => {
    expect(appSrc).toContain('handleFamilyChange')
    expect(appSrc).toMatch(/handleFamilyChange[\s\S]*?setFont/)
  })

  it('useDynamicFont is called with debounceMs: 150', () => {
    expect(appSrc).toContain('debounceMs: 150')
  })

  it('handleSizeChange calls setFont with the new font size', () => {
    expect(appSrc).toContain('handleSizeChange')
    expect(appSrc).toMatch(/handleSizeChange[\s\S]*?setFont/)
  })

  it('imports useDynamicFont from shared hooks', () => {
    expect(appSrc).toContain('useDynamicFont')
    expect(appSrc).toMatch(/from ['"]\.\.\/shared\/hooks\/index\.js['"]/)
  })
})

// ---------------------------------------------------------------------------
// AC04: visual / structural verification
// ---------------------------------------------------------------------------

describe('US-002 AC04: structural and CSS verification', () => {
  it('demo-df-controls CSS class is defined in demo.css', () => {
    expect(cssSrc).toContain('.demo-df-controls')
  })

  it('demo-df-slider CSS class is defined in demo.css', () => {
    expect(cssSrc).toContain('.demo-df-slider')
  })

  it('demo-df-select CSS class is defined in demo.css', () => {
    expect(cssSrc).toContain('.demo-df-select')
  })

  it('demo-df-table CSS class is defined in demo.css', () => {
    expect(cssSrc).toContain('.demo-df-table')
  })

  it('table applies currentFont to the font style property', () => {
    expect(appSrc).toContain('font: currentFont')
  })

  it('fonts.ts exports FONT_FAMILY_SANS constant used by the demo', () => {
    expect(fontsSrc).toContain('FONT_FAMILY_SANS')
    expect(appSrc).toContain('FONT_FAMILY_SANS')
  })

  it('fonts.ts exports FONT_FAMILY_SERIF constant used by the demo', () => {
    expect(fontsSrc).toContain('FONT_FAMILY_SERIF')
    expect(appSrc).toContain('FONT_FAMILY_SERIF')
  })

  it('fonts.ts exports FONT_FAMILY_MONO constant used by the demo', () => {
    expect(fontsSrc).toContain('FONT_FAMILY_MONO')
    expect(appSrc).toContain('FONT_FAMILY_MONO')
  })

  it('fonts.ts exports FONT_FAMILY_SYSTEM constant used by the demo', () => {
    expect(fontsSrc).toContain('FONT_FAMILY_SYSTEM')
    expect(appSrc).toContain('FONT_FAMILY_SYSTEM')
  })

  it('demo-df-table uses border-collapse: collapse', () => {
    expect(cssSrc).toMatch(/\.demo-df-table[^{]*\{[^}]*border-collapse\s*:\s*collapse/)
  })

  it('slider thumb is styled with accent color', () => {
    expect(cssSrc).toContain('demo-df-slider::-webkit-slider-thumb')
    expect(cssSrc).toMatch(/background\s*:\s*var\(--accent\)/)
  })

  it('DynamicFontDemo data array DF_ROWS has at least 3 rows', () => {
    const matches = appSrc.match(/id: 'df\d+'/g) ?? []
    expect(matches.length).toBeGreaterThanOrEqual(3)
  })
})
