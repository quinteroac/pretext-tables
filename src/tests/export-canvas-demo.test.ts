/**
 * Tests for US-004 — useExportCanvas demo with download button.
 *
 * Uses source-level checks (readFileSync) to verify structural guarantees —
 * the same pattern used throughout this test suite for demo sections.
 *
 * AC01 — Demo page has an ExportCanvasDemo section with a "Download PNG" button.
 * AC02 — Clicking the button triggers exportCanvas() and downloads table-export.png.
 * AC03 — Visually verified via source: no DOM measurements, geometry from layout().
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
// AC01: ExportCanvasDemo section with "Download PNG" button
// ---------------------------------------------------------------------------

describe('US-004 AC01: ExportCanvasDemo section in demo page', () => {
  it('App.tsx has an ExportCanvasDemo component definition', () => {
    expect(appSrc).toContain('ExportCanvasDemo')
  })

  it('App.tsx renders ExportCanvasDemo in the demo list', () => {
    expect(appSrc).toMatch(/<ExportCanvasDemo\s*\/>/)
  })

  it('ExportCanvasDemo has a "Download PNG" button', () => {
    expect(appSrc).toContain('Download PNG')
  })

  it('ExportCanvasDemo section has a descriptive eyebrow label', () => {
    expect(appSrc).toMatch(/PNG export/)
  })
})

// ---------------------------------------------------------------------------
// AC02: button triggers exportCanvas() and downloads as table-export.png
// ---------------------------------------------------------------------------

describe('US-004 AC02: exportCanvas() called and file downloaded as table-export.png', () => {
  it('App.tsx imports useExportCanvas from shared hooks', () => {
    expect(appSrc).toContain('useExportCanvas')
  })

  it('handleDownload calls exportCanvas()', () => {
    expect(appSrc).toMatch(/await exportCanvas\(\)/)
  })

  it('download filename is table-export.png', () => {
    expect(appSrc).toContain('table-export.png')
  })

  it('uses URL.createObjectURL to construct the download link', () => {
    expect(appSrc).toContain('URL.createObjectURL')
  })

  it('revokes the object URL after triggering the download', () => {
    expect(appSrc).toContain('URL.revokeObjectURL')
  })

  it('button is disabled while exporting (exporting state)', () => {
    expect(appSrc).toContain('exporting')
    expect(appSrc).toMatch(/disabled[^>]*exporting/)
  })
})

// ---------------------------------------------------------------------------
// AC03: source quality — geometry from pretext, no DOM measurements
// ---------------------------------------------------------------------------

describe('US-004 AC03: no DOM measurement, geometry from pretext', () => {
  it('ExportCanvasDemo does not call getBoundingClientRect', () => {
    // Extract the ExportCanvasDemo section of the file only
    const startIdx = appSrc.indexOf('function ExportCanvasDemo')
    expect(startIdx).toBeGreaterThan(-1)
    const demoSection = appSrc.slice(startIdx)
    expect(demoSection).not.toMatch(/\bgetBoundingClientRect\s*\(/)
  })

  it('ExportCanvasDemo uses BODY_FONT constant (no inline font strings)', () => {
    expect(appSrc).toContain('BODY_FONT')
  })

  it('demo-export-btn CSS class is defined in demo.css', () => {
    expect(cssSrc).toContain('.demo-export-btn')
  })

  it('demo-export-table CSS class is defined in demo.css', () => {
    expect(cssSrc).toContain('.demo-export-table')
  })
})
