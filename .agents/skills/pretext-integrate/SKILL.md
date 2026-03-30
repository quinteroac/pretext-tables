# Skill: pretext-integrate

Guides developers through integrating `@chenglou/pretext` into a real project. Conducts a short focused interview (max 3 questions), then generates complete, runnable integration code matched to the user's rendering target and data shape.

## Instructions

### 1. Check for existing context

- **Argument provided** (e.g., `/pretext-integrate virtualized list`) — map it to the closest use-case path in step 3 and skip the interview.
- **User shared code** — use `Read` to inspect the file(s) before generating code so the output matches their existing patterns.
- **No context** — go to step 2.

### 2. Focused interview — one question at a time

Ask only the questions you need. Stop as soon as you have enough to generate correct code (max 3 questions).

#### Q1 — Rendering target

> What are you rendering into?

- **DOM / React** — height-based layout, virtual lists, masonry grids
- **Canvas / WebGL** — manual `fillText` calls, game UI, data viz
- **SVG** — `<text>` elements with computed positions
- **SSR / Node.js** — build-time metrics, server-rendered layouts

#### Q2 — Volume

> Are you measuring a single text or a batch?

- **Single** — show the direct pattern
- **Batch** — show a loop where `prepare()` runs outside the render cycle

#### Q3 — Line data

> Do you need the text content of individual lines, or just total height and line count?

- **Height / count only** — use `prepare()` + `layout()`
- **Line content** — use `prepareWithSegments()` + `layoutWithLines()` or `layoutNextLine()`

### 3. Use-case paths

Generate complete, runnable code for the matched path. Always include the install command and import statement. Always add a comment explaining why `prepare()` is separated from `layout()`.

---

#### Path A — Virtual list / masonry grid

```ts
import { prepare, layout } from '@chenglou/pretext'

const FONT = '16px Inter'
const LINE_HEIGHT = 24

// Prepare all items once when data loads — not during render.
// prepare() uses Canvas API (~19 ms / 500 items); layout() is pure arithmetic.
const prepared = items.map(item => prepare(item.text, FONT))

function getItemHeight(index: number, containerWidth: number): number {
  return layout(prepared[index], containerWidth, LINE_HEIGHT).height
}
```

For React, memoize `prepared` so it survives re-renders:

```ts
const prepared = useMemo(
  () => items.map(item => prepare(item.text, FONT)),
  [items]
)
```

---

#### Path B — Canvas line-by-line rendering

```ts
import { prepareWithSegments, layoutWithLines } from '@chenglou/pretext'

const FONT = '16px Inter'
const LINE_HEIGHT = 24

// Prepare once when text data arrives.
const prepared = prepareWithSegments(text, FONT)

function renderText(ctx: CanvasRenderingContext2D, x: number, y: number, maxWidth: number) {
  const { lines } = layoutWithLines(prepared, maxWidth, LINE_HEIGHT)
  ctx.font = FONT
  lines.forEach((line, i) => {
    ctx.fillText(line.text, x, y + i * LINE_HEIGHT)
  })
}
```

For an incremental iterator (useful when lines have different widths):

```ts
import { prepareWithSegments, layoutNextLine, type LayoutCursor } from '@chenglou/pretext'

const prepared = prepareWithSegments(text, FONT)
let cursor: LayoutCursor = { segmentIndex: 0, graphemeIndex: 0 }
let y = startY
let line

while ((line = layoutNextLine(prepared, cursor, maxWidth)) !== null) {
  ctx.fillText(line.text, x, y)
  y += LINE_HEIGHT
  cursor = line.end
}
```

---

#### Path C — Variable-width text flow

Use `layoutNextLine()` with a different `maxWidth` on each call. This enables text that flows around a floated element or inside any non-rectangular container.

```ts
import { prepareWithSegments, layoutNextLine } from '@chenglou/pretext'

const prepared = prepareWithSegments(text, FONT)
let cursor = { segmentIndex: 0, graphemeIndex: 0 }
let lineIndex = 0
let line

while ((line = layoutNextLine(prepared, cursor, getLineWidth(lineIndex))) !== null) {
  renderLine(line.text, lineIndex)
  cursor = line.end
  lineIndex++
}

// getLineWidth() returns the available width for each line position —
// e.g., narrower for lines beside an image, full width elsewhere.
function getLineWidth(lineIndex: number): number {
  return lineIndex < floatHeightInLines ? containerWidth - floatWidth : containerWidth
}
```

---

#### Path D — Container shrink-wrap

Find the minimum `maxWidth` at which the text fits on exactly N lines (or doesn't wrap). Binary-search over `maxWidth` using `layout()`.

```ts
import { prepare, layout } from '@chenglou/pretext'

const prepared = prepare(text, FONT)

function shrinkWrap(targetLineCount = 1, min = 0, max = 2000): number {
  // Binary search for the smallest maxWidth that produces targetLineCount lines.
  while (min < max - 1) {
    const mid = Math.floor((min + max) / 2)
    const { lineCount } = layout(prepared, mid, LINE_HEIGHT)
    if (lineCount <= targetLineCount) max = mid
    else min = mid
  }
  return max
}
```

---

#### Path E — SSR / Node.js

Pretext uses the Canvas API internally. In Node.js, install `node-canvas` and register it before importing pretext.

```bash
npm install @chenglou/pretext canvas
```

```ts
import { createCanvas } from 'canvas'  // node-canvas

// Register a global canvas factory for pretext to use.
// Do this once at app startup, before any prepare() calls.
;(globalThis as any).document = {
  createElement: (tag: string) => tag === 'canvas' ? createCanvas(0, 0) : null
}

import { prepare, layout } from '@chenglou/pretext'

// Now prepare() and layout() work exactly as in the browser.
const prepared = prepare(text, '16px Arial')
const { height, lineCount } = layout(prepared, 320, 24)
```

> Note: font rendering in Node.js may differ slightly from the browser. Use the same fonts and font sizes in both environments for the closest match.

---

### 4. Anti-pattern warning

> **Do not call `prepare()` inside a React render function, a `useEffect` that runs on every render, or any per-frame loop.** `prepare()` invokes the Canvas API and costs ~19 ms per batch. Call it once when data loads, store the result, and call `layout()` during render — `layout()` is pure arithmetic and takes ~0.09 ms.

---

### 5. Font loading timing

`prepare()` measures text using whichever font the Canvas has loaded at call time. If the custom font hasn't loaded yet, measurements use the fallback font and will be wrong.

**Browser:**

```ts
// Wait for fonts before measuring.
await document.fonts.ready
const prepared = prepare(text, '16px "My Custom Font"')
```

**Node.js (node-canvas):**

```ts
import { registerFont } from 'canvas'
registerFont('./fonts/Inter.ttf', { family: 'Inter' })
// Now safe to call prepare() with "16px Inter"
```

---

### 6. Deep-dive

After generating code, ask:

> Want me to go deeper on any of these?
> - Font loading edge cases (FOUT, fallback fonts, font-display)
> - Cache management (`clearCache`, when to call it)
> - TypeScript types and `LayoutCursor` usage
> - Multilingual / RTL / CJK text handling and `setLocale`

### General rules

- Always generate complete, runnable snippets — no pseudocode.
- Always separate `prepare()` from the layout/render loop in the generated code with a comment explaining why.
- Match the code idiom to the user's stack (React hooks, plain JS, Node modules).
- Respond in the same language the user writes in.
