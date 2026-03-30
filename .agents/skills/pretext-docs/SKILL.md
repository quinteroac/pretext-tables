# pretext docs

## What it is

`@chenglou/pretext` is a pure JavaScript/TypeScript library that measures and lays out multiline text without touching the DOM. It eliminates expensive browser layout reflows (`getBoundingClientRect`, `offsetHeight`) from text-sizing code. Works in browser and Node.js (requires Canvas API).

```bash
npm install @chenglou/pretext
```

```ts
import { prepare, layout } from '@chenglou/pretext'
```

---

## Two-phase model

The library separates work into two phases — understand this before writing any code:

| Phase | Function | What it does | Cost |
|---|---|---|---|
| **Prepare** | `prepare()` | Tokenizes text, measures segments with Canvas font engine, caches results | ~19 ms / 500 texts |
| **Layout** | `layout()` | Pure arithmetic line-breaking using cached widths — zero DOM | ~0.09 ms / text |

**Rule:** Call `prepare()` once per unique `(text, font)` pair and store the result. Call `layout()` as many times as needed (different widths, on resize, in render loops). Never call `prepare()` inside a render loop.

---

## Core API

| Function | Signature | Returns | When to use |
|---|---|---|---|
| `prepare` | `(text, font, options?)` | `PreparedText` | One-time measurement. Use when you only need height/count afterward. |
| `prepareWithSegments` | `(text, font, options?)` | `PreparedTextWithSegments` | Use when you need `layout­WithLines`, `layoutNextLine`, or `walkLineRanges`. |
| `layout` | `(prepared, maxWidth, lineHeight)` | `LayoutResult` | Fast height + line count. Requires only `PreparedText`. |
| `layoutWithLines` | `(prepared, maxWidth, lineHeight)` | `LayoutLinesResult` | Returns each line's text, width, and cursor positions. Requires `PreparedTextWithSegments`. |
| `layoutNextLine` | `(prepared, cursor, maxWidth)` | `LayoutLine \| null` | Iterator-style: one line at a time, optionally with a different `maxWidth` per call. Requires `PreparedTextWithSegments`. |
| `walkLineRanges` | `(prepared, maxWidth, onLine)` | `number` (line count) | Geometry pass — invokes `onLine` per line without materializing text strings. Fastest option when you only need widths/positions. Requires `PreparedTextWithSegments`. |
| `profilePrepare` | `(text, font, options?)` | `PrepareProfile` | Diagnostic timing breakdown. Use when debugging slow `prepare()` calls. |
| `clearCache` | `()` | `void` | Clears the global Canvas measurement cache. Call only when fonts change at runtime. |
| `setLocale` | `(locale?)` | `void` | Sets locale for `Intl.Segmenter` word-break rules. Affects all subsequent `prepare()` calls globally. |

---

## Type reference

```ts
// Opaque handles — do not inspect internals
type PreparedText = { /* opaque */ }
type PreparedTextWithSegments = PreparedText & { segments: string[] }

// layout() output
type LayoutResult = {
  lineCount: number   // number of wrapped lines
  height: number      // lineCount * lineHeight
}

// layoutWithLines() output
type LayoutLinesResult = LayoutResult & {
  lines: LayoutLine[]
}

// One line of text
type LayoutLine = {
  text: string          // the text content of this line
  width: number         // measured width in px
  start: LayoutCursor   // cursor at start of line
  end: LayoutCursor     // cursor at end of line (start of next)
}

// Geometry-only line (walkLineRanges)
type LayoutLineRange = {
  width: number
  start: LayoutCursor
  end: LayoutCursor
}

// Position within prepared text
type LayoutCursor = {
  segmentIndex: number    // index into the segments array
  graphemeIndex: number   // grapheme offset within the segment
}

// prepare() options
type PrepareOptions = {
  whiteSpace?: 'normal' | 'pre-wrap'
  // 'normal'   — collapses whitespace, wraps at word boundaries (default)
  // 'pre-wrap' — preserves spaces and newlines (textarea-style)
}

// profilePrepare() output
type PrepareProfile = {
  analysisMs: number        // time spent in Intl.Segmenter
  measureMs: number         // time spent measuring with Canvas
  totalMs: number
  analysisSegments: number  // segments produced by segmenter
  preparedSegments: number  // segments after merging/normalization
  breakableSegments: number // segments that are valid line-break points
}
```

---

## Font string format

The `font` argument is a **CSS font shorthand string** — the same value you pass to `ctx.font` on a Canvas 2D context.

```
"16px Arial"
"bold 14px sans-serif"
"italic 600 18px/1.5 'Helvetica Neue', sans-serif"
 ──────────────────────────────────────────────────
 style  weight size/line-height  family
```

The font family must match exactly what the browser has loaded. A mismatch silently falls back to the system default, producing wrong measurements. Always wait for fonts to be ready before calling `prepare()`.

---

## Function selection matrix

| Goal | Recommended function |
|---|---|
| Paragraph height or line count only | `prepare()` + `layout()` |
| Line text + widths (for Canvas rendering) | `prepareWithSegments()` + `layoutWithLines()` |
| Variable `maxWidth` per line (shaped containers) | `prepareWithSegments()` + `layoutNextLine()` loop |
| Line geometry without building strings (perf-critical) | `prepareWithSegments()` + `walkLineRanges()` |
| Diagnose slow `prepare()` | `profilePrepare()` |

---

## Global caveats

- **`clearCache()`** — clears the Canvas measurement cache shared across all calls. Only needed if fonts change after initial load (e.g., a font is swapped at runtime). Do not call it in hot paths.
- **`setLocale(locale?)`** — sets the locale for `Intl.Segmenter`. Affects word-break and line-break behavior globally. Call once at app startup if your content uses a non-default locale. Pass no argument to reset to the runtime default.
- **Canvas requirement** — `prepare()` uses the Canvas 2D API to measure font metrics. In Node.js, install and register a Canvas shim (e.g., `node-canvas`) before importing pretext.
- **SSR** — pretext can run server-side with `node-canvas`. Measurements are font-renderer-dependent, so results may differ slightly between Node and browser if font rendering engines differ.
