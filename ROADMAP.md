# ROADMAP

Ideas and planned work for `pretext-tables`. Ordered roughly by value and implementation cost.

---

## Already shipped

| Component / Hook | Description |
|---|---|
| `BasicTable` | Fixed column widths, no interaction |
| `ExpandableTable` | Scales columns proportionally when container resizes |
| `ResizableTable` | Drag handles for column widths and row heights |
| `VirtualizedTable` | Renders only visible rows; exact heights from pretext, no estimation |
| `DraggableTable` | Drag-to-reorder rows and columns |
| `useMeasure` | Core hook — `prepare()` + `layout()` + `fontsReady` |
| `useResizable` | Drag state for column and row handles |
| `useExpandable` | ResizeObserver wrapper for container-aware tables |
| `useVirtualization` | Binary-search virtual window over pretext-computed offsets |
| `useDraggable` | Row and column reorder drag state |

---

## Architectural principle: hooks first

Every feature is implemented as a hook in `src/shared/hooks/` before being composed into any pre-built table. This means any consumer can pick individual hooks and build their own table — just like the existing `useMeasure`, `useResizable`, `useExpandable`, `useVirtualization`, and `useDraggable`.

Pre-built tables (`BasicTable`, `ResizableTable`, etc.) are thin compositions of hooks — they do not own features, they demonstrate them.

---

## Next — foundations

These complete the existing components and fix the most requested gaps.

### `useStickyHeaders` hook
Manages a `headers` array and returns props for the `<thead>` element to apply `position: sticky`. Any table can use it — not just `VirtualizedTable`. The pre-built `VirtualizedTable` will gain a `headers?` prop as a convenience wrapper.

### `useColumnVisibility` hook
Manages a `boolean[]` visibility mask. Returns a filtered `columnWidths` array ready to pass into `useMeasure`. When columns are toggled, only `layout()` re-runs — `prepare()` is unaffected since the underlying text data does not change.

### `useSorting` hook
Manages sort column + direction state. Returns a sorted `rows[]` view (index remapping, not mutation) and `getSortHandleProps()` for header cells. Because `prepare()` is keyed to the original rows, it never re-runs on sort — only the index order changes.

---

## Next — interactions that showcase pretext's advantage

These are features where the "no reflow" property makes a visible, demonstrable difference over existing libraries.

### `useShrinkWrap` hook
Given `prepared` text and a column index, binary-searches for the minimum column width where no cell wraps — using `walkLineRanges()` with zero DOM calls. Returned as a `fitColumn(colIndex)` function, callable on double-click of a resize handle. Any table using `useResizable` can compose this. Something `getBoundingClientRect`-based libraries approximate; here it is exact.

### `useResizePreview` hook
While a column drag is in-flight, computes the new text wrap for every visible cell in that column via `layout()` at ~0.09 ms per row. Returns a `previewHeights[]` array that components can render as a ghost layer — no re-render of the real table until drag ends. Composable on top of `useResizable`.

### `useScrollAnchor` hook
When rows are prepended to the dataset (e.g. real-time feed, chat history), computes the exact `scrollTop` correction needed to keep the currently visible row stable — using pretext offsets calculated before the DOM updates. Returns a ref and a `prepend(newRows)` function. No scroll jump, no hack.

---

## Later — new table types

Each new table type is a composition of existing + new hooks. The hooks are the deliverable; the table component is the demo.

### `useStickyColumns` hook 
Manages a `frozenCount` of left-pinned columns. Returns separate `frozenWidths` and `scrollWidths` arrays that both feed the same `useMeasure` call, keeping row heights in sync between the frozen and scrollable sections without any DOM coordination.

### `useInfiniteScroll` hook 
Manages page loading as the user scrolls toward the bottom. Returns an `onScroll` handler and a `isLoading` flag. Heights for incoming rows are calculated with pretext before they enter the DOM, preventing the scroll-position jump common in DOM-measurement approaches. Composes with `useVirtualization`.

### `useCanvasCell` hook 
Returns a `drawCell(ctx, rowIndex, colIndex, x, y)` function that renders a cell's text to a `<canvas>` using `layoutWithLines()` coordinates. Enables effects impossible in HTML:
- Keyword highlights at exact pixel positions
- Text with gradient fill or drop shadow
- Smooth fade-out truncation instead of `…`
- Animated numeric counters inside cells

### `useDetachable` hook 
Manages expand/collapse state for rows that open a child table in a panel, drawer, or modal. The parent and child are independent `useMeasure` instances — no recursive measurement. Cells remain `string[]`; the child table data is passed as a separate `getChildRows(row)` prop.

### `useMediaCells` hook 
Supports cells that contain text alongside an image or video. Media dimensions must be provided upfront (`mediaHeight`, or `width` + `aspectRatio` for video) — this keeps row heights fully calculable by pretext without any DOM measurement. Row height becomes `textHeight + mediaHeight` when media is visible, or pure `textHeight` when hidden. The hook returns a `toggleMedia(rowId)` function and a `mediaVisible` state map. When a row's media is hidden, `layout()` recalculates the collapsed height instantly — no reflow, no ResizeObserver. Aimed at product catalogues, content tables, and media feeds where rows mix text metadata with a preview image or video thumbnail.

> **Note:** arbitrary JSX inside cells remains out of scope. Only media with known dimensions (passed as data, not measured from DOM) is supported.

### `useSpanningCell` hook 
Exposes the full table geometry — `totalHeight` and `offsets[]` — so a single cell can span the entire height of the table and stay pixel-aligned with each row. Useful for financial dashboards, commodity tables, and any layout where a chart, timeline, or visualization occupies a side column while text rows occupy the other columns.

The hook returns:
- `totalHeight` — sum of all row heights, ready to use as the container height of the spanning element
- `offsets[]` — cumulative Y position of each row, ready to use as tick marks, grid lines, or data point anchors in the spanning SVG/canvas

Both values come from `computeTotalHeight()` and `computeOffsets()` — already implemented in `useVirtualization.ts` — so the hook is a thin wrapper that exposes them at the table level. The consumer renders whatever they want in the spanning slot via a `renderSpanning(totalHeight, offsets) => ReactNode` prop. No DOM measurement needed: the chart knows its exact size before it mounts.

```tsx
// Example: commodity table with a live chart spanning all rows
<SpanningTable
  rows={commodities}
  columnWidths={[220, 140]}
  renderSpanning={(totalHeight, offsets) => (
    <PriceChart height={totalHeight} rowTicks={offsets} data={trendData} />
  )}
/>
```

### `useEditable` hook
Enables inline cell editing where the row height updates **synchronously with each keystroke** — no `ResizeObserver`, no frame delay. On every `input` event, `layout()` runs on the current value (~0.09 ms) and the preview height is set in the same frame, giving a perfectly smooth row expansion as the user types.

Key design constraint: `prepare()` is debounced (~150 ms) to avoid the expensive Canvas pass on every keystroke. While the debounce is pending, `layout()` runs against the previous prepared state — which is accurate for incremental edits (the common case) and only approximates for entirely new text.

Returns `getEditProps(rowIndex, colIndex)` — spreads onto a `<textarea>` or `contenteditable` — plus `previewHeights[]` (same shape as `useMeasure`'s output, with the active cell's height updated live). Composable with `useResizable` so drag-resized column widths are honoured during editing.

### `useCellNotes` hook
Accepts a `notes` map (`Record<"rowId:colIndex", string>`) and pre-measures all note texts with `prepare()` alongside the main table data. Returns `getNoteTriggerProps(rowIndex, colIndex)` for hover targets and a `<NoteTooltip>` component whose dimensions are known before it appears — so positioning is correct on the first frame with zero repositioning flash. Standard tooltip libraries measure content after mount and correct position in a follow-up paint; pretext eliminates that step entirely.

### `useDynamicFont` hook
Accepts a `font` string that can change at runtime — a slider-controlled size, a user-selected typeface, or a density toggle — and returns `rowHeights[]` that update synchronously whenever the font changes. Because all measurement happens in pretext (canvas), switching from `'14px Inter'` to `'20px Inter'` triggers `prepare()` + `layout()` with zero DOM reflow and no `ResizeObserver`.

Key design constraint: `prepare()` is debounced when the font changes continuously (e.g. a live size slider) to avoid a canvas pass on every paint frame. `layout()` runs immediately against the previous prepared state for a smooth visual update during the debounce window.

Returns `{ rowHeights: number[], setFont: (font: string) => void, currentFont: string }`. Composable with `useResizable` and `useVirtualization` — virtual offsets and drag-resized widths stay correct across font changes. The demo shows a font-size slider and a font-family selector that smoothly reshape all row heights with no DOM cost.

> This is a showcase feature: the instant row-height recalculation on font change is something DOM-measurement-based libraries cannot do cheaply — they require a full reflow. With pretext, it is a single `layout()` call.

---

## Speculative / exploratory

Ideas worth prototyping before committing.

### `useExportCanvas` hook
Renders the full table (all rows, including those outside the virtual window) to an offscreen `<canvas>` and returns a PNG blob. Works because pretext already has all geometry — no DOM painting needed. No pre-built table component needed; it's a pure utility hook.

### `useSearch` hook
Filters `rows[]` by a query string and returns match coordinates per cell using `layoutWithLines()`. Consumers can use these coordinates to draw highlight rectangles behind matched characters — more precise than `<mark>` (which disrupts text measurement) and correct for multilingual text and emojis.

### `whiteSpace: 'pre-wrap'` option in `useMeasure`
Expose the existing pretext `{ whiteSpace: 'pre-wrap' }` option as a `useMeasure` parameter. Enables cells with tab-indented or newline-separated content (code snippets, addresses). Requires matching `white-space: pre-wrap` in the table CSS.

---

## Out of scope

- Inline nested tables (cells containing full table components). Requires recursive measurement that breaks the `string[]` cell model.
- Arbitrary JSX cell content. Once cell content is not text, pretext cannot measure it — use DOM measurement (`ResizeObserver`) instead.
- Mixing `useExpandable` (container-scale) with drag handles in the same table. These are distinct interaction models.
