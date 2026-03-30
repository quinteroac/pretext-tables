# Skill: pretext-art

Generates complete Canvas/SVG code for artistic and creative text effects powered by `@chenglou/pretext`. Pretext provides the precise per-line measurements (widths, positions, cursors); the art is in what you do with those numbers.

## Instructions

### 1. Check for existing context

- **Argument provided** (e.g., `/pretext-art wavy text`) — map it to the closest effect path and skip the question.
- **User shared a file** — read it to match their existing canvas setup and code style.
- **No context** — ask the single question in step 2.

### 2. One question — pick an effect

> What effect are you going for?

Present this menu and wait for a selection:

```
A — Kinetic / animated typography (text reflows in real time as width animates)
B — Shaped container (text fills a circle, polygon, or custom outline)
C — Wavy / curved baseline (sinusoidal or path-based vertical offsets)
D — Tapering / variable size (large first line, decreasing font size per line)
E — Generative poster / grid (multiple text blocks composed into a layout)
F — Describe your own idea
```

If they describe their own idea (F), identify which primitives it needs (`layoutNextLine` for variable widths, `walkLineRanges` for geometry-only, `layoutWithLines` for content) and compose accordingly.

### 3. Effect paths

Generate complete, runnable Canvas code. Always include the `prepare()` call outside the animation/render loop with a comment explaining why.

---

#### Path A — Kinetic / animated typography

Animate `maxWidth` over time. `layout()` re-runs each frame but is pure arithmetic (~0.09 ms) — safe in `requestAnimationFrame`.

```ts
import { prepare, layout } from '@chenglou/pretext'

const canvas = document.querySelector('canvas')!
const ctx = canvas.getContext('2d')!
const FONT = 'bold 32px sans-serif'
const LINE_HEIGHT = 40
const TEXT = 'Design is\nhow it works.'

// Prepare once — this uses the Canvas API and is the expensive step.
const prepared = prepare(TEXT, FONT)

let startTime = performance.now()

function draw() {
  const elapsed = (performance.now() - startTime) / 1000
  // Oscillate maxWidth between 80 px and canvas width
  const maxWidth = 80 + ((canvas.width - 80) / 2) * (1 + Math.sin(elapsed * 0.8))

  ctx.clearRect(0, 0, canvas.width, canvas.height)

  const { lineCount } = layout(prepared, maxWidth, LINE_HEIGHT)
  const totalHeight = lineCount * LINE_HEIGHT
  const y = (canvas.height - totalHeight) / 2  // vertically centered

  ctx.font = FONT
  ctx.fillStyle = '#111'

  // Re-compute line text for rendering at current width
  import('@chenglou/pretext').then(({ prepareWithSegments, layoutWithLines }) => {
    // In a real app, keep preparedWithSegments alongside prepared
  })

  requestAnimationFrame(draw)
}

draw()
```

For line-content rendering in the animation loop, use `prepareWithSegments` + `layoutWithLines`:

```ts
import { prepareWithSegments, layoutWithLines } from '@chenglou/pretext'

const prepared = prepareWithSegments(TEXT, FONT)  // prepare once

function draw() {
  const maxWidth = /* animated value */

  ctx.clearRect(0, 0, canvas.width, canvas.height)
  ctx.font = FONT
  ctx.fillStyle = '#111'

  const { lines } = layoutWithLines(prepared, maxWidth, LINE_HEIGHT)
  const offsetY = (canvas.height - lines.length * LINE_HEIGHT) / 2

  lines.forEach((line, i) => {
    // Center each line horizontally
    const x = (canvas.width - line.width) / 2
    ctx.fillText(line.text, x, offsetY + i * LINE_HEIGHT)
  })

  requestAnimationFrame(draw)
}

draw()
```

---

#### Path B — Shaped container (circle, polygon, mask)

`layoutNextLine(prepared, cursor, maxWidth)` accepts a **different `maxWidth` on every call**. Use the chord length of the shape at each Y position as the `maxWidth` for that line.

```ts
import { prepareWithSegments, layoutNextLine, type LayoutCursor } from '@chenglou/pretext'

const FONT = '16px serif'
const LINE_HEIGHT = 22
const TEXT = 'Text that fills a circle shape...'

const prepared = prepareWithSegments(TEXT, FONT)

// Compute chord width of a circle at a given y offset from center.
function circleChord(radius: number, yOffset: number): number {
  const d = Math.abs(yOffset)
  if (d >= radius) return 0
  return 2 * Math.sqrt(radius * radius - d * d)
}

function renderInCircle(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  radius: number
) {
  ctx.font = FONT
  ctx.textAlign = 'center'

  let cursor: LayoutCursor = { segmentIndex: 0, graphemeIndex: 0 }
  let lineY = cy - radius + LINE_HEIGHT
  let line

  while (lineY < cy + radius && (line = layoutNextLine(prepared, cursor, circleChord(radius, lineY - cy))) !== null) {
    ctx.fillText(line.text, cx, lineY)
    lineY += LINE_HEIGHT
    cursor = line.end
  }
}
```

For polygons or arbitrary shapes, replace `circleChord()` with a function that returns the horizontal span of the shape at each Y scan line.

---

#### Path C — Wavy / curved baseline

Use `walkLineRanges()` to get line widths, then draw each line with a sinusoidal Y offset.

```ts
import { prepareWithSegments, layoutWithLines } from '@chenglou/pretext'

const FONT = '18px Georgia'
const LINE_HEIGHT = 28
const TEXT = 'Words wave and flow like water on a shore.'

const prepared = prepareWithSegments(TEXT, FONT)

function renderWavy(
  ctx: CanvasRenderingContext2D,
  x: number,
  baseY: number,
  maxWidth: number,
  amplitude = 8,
  frequency = 0.04,
  phase = 0  // animate this over time for movement
) {
  const { lines } = layoutWithLines(prepared, maxWidth, LINE_HEIGHT)
  ctx.font = FONT

  lines.forEach((line, i) => {
    const waveOffset = Math.sin(i * frequency * 10 + phase) * amplitude
    ctx.fillText(line.text, x, baseY + i * LINE_HEIGHT + waveOffset)
  })
}

// Animated version
let phase = 0
function animate() {
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  renderWavy(ctx, 40, 80, canvas.width - 80, 10, 0.05, phase)
  phase += 0.04
  requestAnimationFrame(animate)
}
animate()
```

---

#### Path D — Tapering / variable font size

Loop over font sizes from large to small, calling `layout()` to find how many lines each size produces. Render each line at a decreasing font size.

```ts
import { prepare, layout, prepareWithSegments, layoutWithLines } from '@chenglou/pretext'

const LINE_HEIGHT = 48
const MAX_WIDTH = 500
const TEXT = 'Big idea. Smaller details. Fine print at the end.'

function renderTapering(ctx: CanvasRenderingContext2D, x: number, y: number) {
  // Font sizes per line — customize this gradient
  const fontSizes = [48, 36, 24, 18, 14]
  let words = TEXT.split(' ')
  let currentY = y

  for (const size of fontSizes) {
    if (words.length === 0) break
    const font = `${size}px sans-serif`
    const lineH = size * 1.3

    // Try fitting words greedily at this size
    const prepared = prepareWithSegments(words.join(' '), font)
    const { lines } = layoutWithLines(prepared, MAX_WIDTH, lineH)

    // Render only the first line at this size
    const firstLine = lines[0]
    ctx.font = font
    ctx.fillText(firstLine.text, x, currentY + size)
    currentY += lineH

    // Remove rendered words from the queue
    words = words.slice(firstLine.text.split(' ').length)
  }
}
```

---

#### Path E — Generative poster / grid

Batch `prepare()` for all text blocks, then lay them out as cells in a grid with custom spacing and alignment.

```ts
import { prepareWithSegments, layoutWithLines } from '@chenglou/pretext'

const CELLS = [
  { text: 'LARGE\nHEADLINE', font: 'bold 48px sans-serif', lineHeight: 52 },
  { text: 'A secondary thought in smaller type.', font: '18px serif', lineHeight: 26 },
  { text: 'Caption text.', font: '12px monospace', lineHeight: 18 },
]

// Prepare all cells outside the render pass.
const prepared = CELLS.map(c => prepareWithSegments(c.text, c.font))

function renderPoster(ctx: CanvasRenderingContext2D, colWidth: number) {
  const PADDING = 24
  let y = PADDING

  CELLS.forEach((cell, i) => {
    const { lines } = layoutWithLines(prepared[i], colWidth - PADDING * 2, cell.lineHeight)
    ctx.font = cell.font
    lines.forEach((line, j) => {
      ctx.fillText(line.text, PADDING, y + j * cell.lineHeight)
    })
    y += lines.length * cell.lineHeight + PADDING
  })
}
```

---

### 4. Key insight

> `layoutNextLine(prepared, cursor, maxWidth)` accepts a **different `maxWidth` every call**. This single feature enables shaped containers, irregular columns, text around floated elements, and any non-rectangular flow. The cursor advances through the text regardless of how `maxWidth` changes between lines.

---

### 5. Canvas setup tips

**Pixel ratio** — always scale the canvas for sharp rendering on HiDPI screens:

```ts
const dpr = window.devicePixelRatio || 1
canvas.width = displayWidth * dpr
canvas.height = displayHeight * dpr
canvas.style.width = `${displayWidth}px`
canvas.style.height = `${displayHeight}px`
ctx.scale(dpr, dpr)
```

**Font string consistency** — the `font` argument passed to `prepare()` must match `ctx.font` exactly (same family, size, weight, style). A mismatch causes pretext's measurements to not match what Canvas draws.

**Double-buffering** — for smooth animation, call `ctx.clearRect(0, 0, w, h)` at the top of each `requestAnimationFrame` callback before re-drawing.

---

### 6. Deep-dive

After generating code, offer:

> Want me to add any of these?
> - Hit-testing (detect which line or word a click/tap landed on using `LayoutCursor`)
> - Scroll-linked or scroll-triggered text effects
> - Export to SVG (`<text>` elements with `x`/`y` from line positions)
> - Export to PNG (`canvas.toDataURL()` or `canvas.toBlob()`)
> - Handling emoji and CJK characters in artistic layouts

### General rules

- Generate complete, self-contained code snippets — no pseudocode or ellipsis placeholders.
- Keep `prepare()` outside animation/render loops in all generated code.
- Add inline comments explaining the geometry math (readers shouldn't have to reverse-engineer sin/cos or chord formulas).
- Respond in the same language the user writes in.
