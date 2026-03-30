# Requirement: Dynamic Font, Canvas Export, Search, pre-wrap, and GridTable

## Context

Iteration 000005 extends the `pretext-tables` hook layer and component library with five additions:

1. **`useDynamicFont`** — a hook that accepts a runtime-changeable font string and returns updated `rowHeights[]` with debounced `prepare()` calls to avoid per-frame canvas work during continuous input (e.g. a slider).
2. **`useExportCanvas`** — a pure utility hook that renders the full table (all rows, including those outside any virtual window) to an offscreen `<canvas>` and returns a PNG `Blob`, leveraging pretext geometry directly.
3. **`useSearch`** — filters `rows[]` by a query string and returns per-cell match coordinates via `layoutWithLines()`, enabling precise highlight rectangles without disrupting text measurement.
4. **`whiteSpace: 'pre-wrap'` option in `useMeasure`** — exposes the existing pretext `{ whiteSpace: 'pre-wrap' }` option as a first-class parameter so cells with newlines or tab-indented content measure correctly.
5. **`GridTable`** — a CSS Grid-based table component (no `<table>` / `<tr>` / `<td>`) built on the existing hook layer, giving full geometry control and working `position: sticky` out of the box.

All features use only `@chenglou/pretext` for measurement — zero DOM reflows.

## Goals

- Provide a `useDynamicFont` hook that re-measures all rows synchronously when the font changes, with debounced `prepare()` for performance.
- Provide a `useExportCanvas` hook that produces a full-table PNG `Blob` from pretext geometry alone.
- Provide a `useSearch` hook that returns filtered rows and per-cell match coordinates for highlight rendering.
- Expose `whiteSpace: 'pre-wrap'` as a `useMeasure` option so multi-line/tabbed cell content measures correctly.
- Deliver a `GridTable` component using CSS Grid with sticky header support, wired to `useMeasure`.
- Demo all five additions on the existing demo page.

## User Stories

### US-001: useDynamicFont — change font at runtime
**As a** developer consuming `pretext-tables`, **I want** to call `setFont('20px Inter')` and immediately receive updated `rowHeights[]` **so that** my table reshapes without triggering DOM reflows.

**Acceptance Criteria:**
- [ ] `useDynamicFont(rows, columnWidths, initialFont)` returns `{ rowHeights, setFont, currentFont }`.
- [ ] Calling `setFont()` with a new font string triggers `prepare()` (debounced, default 150 ms) + `layout()`.
- [ ] `layout()` runs immediately on each call using the previously prepared state, so heights update visually before the debounce fires.
- [ ] After the debounce fires `prepare()`, heights are re-computed with the new font and stabilise.
- [ ] `useDynamicFont` composes correctly with `useResizable` — `columnWidths` passed to both hooks stay in sync.
- [ ] Hook is exported from `src/shared/hooks/index.ts`.
- [ ] Typecheck / lint passes.

### US-002: useDynamicFont — demo with size slider and family selector
**As a** developer evaluating the library, **I want** to see a live demo where a font-size slider and a font-family selector reshape all row heights in real time **so that** I can confirm zero DOM cost.

**Acceptance Criteria:**
- [ ] Demo page includes a `DynamicFontDemo` section with a range slider (12 px – 32 px) and a font-family `<select>`.
- [ ] Adjusting the slider continuously updates `rowHeights[]` without triggering `getBoundingClientRect` or any DOM measurement.
- [ ] Changing the font family updates heights on the next debounce tick.
- [ ] Visually verified in browser.

### US-003: useExportCanvas — export full table as PNG
**As a** developer consuming `pretext-tables`, **I want** to call `exportCanvas()` and receive a PNG `Blob` of the entire table **so that** I can save or share a snapshot without rendering to the DOM.

**Acceptance Criteria:**
- [ ] `useExportCanvas(rows, columnWidths, font, options?)` returns `{ exportCanvas: () => Promise<Blob> }`.
- [ ] `exportCanvas()` renders all rows (not just the visible window) to an offscreen `<canvas>`.
- [ ] Geometry (column widths, row heights) comes from pretext — no DOM measurement.
- [ ] Returns a `Promise<Blob>` with MIME type `image/png`.
- [ ] Hook is exported from `src/shared/hooks/index.ts`.
- [ ] Typecheck / lint passes.

### US-004: useExportCanvas — demo with download button
**As a** developer evaluating the library, **I want** a "Download PNG" button on the demo page **so that** I can verify the exported image matches the rendered table.

**Acceptance Criteria:**
- [ ] Demo page includes a `ExportCanvasDemo` section with a "Download PNG" button.
- [ ] Clicking the button triggers `exportCanvas()` and downloads the result as `table-export.png`.
- [ ] Visually verified in browser: exported image matches the visible table content.

### US-005: useSearch — filter rows and return match coordinates
**As a** developer consuming `pretext-tables`, **I want** to pass a query string and receive filtered rows plus per-cell match coordinates **so that** I can draw precise highlight rectangles over matched text.

**Acceptance Criteria:**
- [ ] `useSearch(rows, columnWidths, font, query)` returns `{ filteredRows, matchCoords }`.
- [ ] `filteredRows` contains only rows where at least one cell matches the query (case-insensitive substring).
- [ ] `matchCoords` is an array parallel to `filteredRows` — each entry maps column index → `{ x, y, width, height }[]` for each match within that cell.
- [ ] Coordinates come from pretext `layoutWithLines()` — no DOM measurement.
- [ ] When `query` is empty, `filteredRows` equals `rows` and `matchCoords` is empty.
- [ ] Hook is exported from `src/shared/hooks/index.ts`.
- [ ] Typecheck / lint passes.

### US-006: useSearch — demo with search input and highlight overlay
**As a** developer evaluating the library, **I want** a search input on the demo page that highlights matched text in the table **so that** I can confirm match coordinates are accurate.

**Acceptance Criteria:**
- [ ] Demo page includes a `SearchDemo` section with a text input and a table that re-renders on each keystroke.
- [ ] Matched characters are overlaid with a highlight rectangle drawn from `matchCoords`.
- [ ] No matches shows an empty table body (zero rows).
- [ ] Visually verified in browser.

### US-007: useMeasure — whiteSpace pre-wrap option
**As a** developer consuming `pretext-tables`, **I want** to pass `{ whiteSpace: 'pre-wrap' }` to `useMeasure` **so that** cells containing newlines or tab-indented content have their heights computed correctly.

**Acceptance Criteria:**
- [ ] `useMeasure(rows, columnWidths, { whiteSpace: 'pre-wrap' })` passes the option through to pretext `prepare()` / `layout()`.
- [ ] `rowHeights[]` for a cell containing `"line1\nline2"` with `pre-wrap` is taller than the same cell without `pre-wrap`.
- [ ] The option defaults to `undefined` (no change to existing behaviour when omitted).
- [ ] `useMeasure` signature and types in `src/shared/hooks/useMeasure.ts` are updated.
- [ ] Typecheck / lint passes.

### US-008: GridTable — CSS Grid-based table component
**As a** developer consuming `pretext-tables`, **I want** a `GridTable` component built with CSS Grid **so that** I get reliable `overflow: hidden` on cells, working sticky headers, and no `<table>` layout interference.

**Acceptance Criteria:**
- [ ] `GridTable` renders using `display: grid` divs — no `<table>`, `<tr>`, or `<td>` elements.
- [ ] `grid-template-columns` is derived from `columnWidths`.
- [ ] `rowHeight` from `useMeasure` is applied as an explicit `height` on each row div.
- [ ] The header row is `position: sticky; top: 0` and stays pinned when scrolling.
- [ ] `overflow: hidden` on cells clips content that exceeds the measured height.
- [ ] Component lives at `src/tables/grid-table/index.tsx` with `measure.ts` and `grid-table.css`.
- [ ] Exported from `src/tables/index.ts`.
- [ ] Typecheck / lint passes.
- [ ] Visually verified in browser.

### US-009: GridTable — demo alongside BasicTable
**As a** developer evaluating the library, **I want** to see `GridTable` demoed next to `BasicTable` on the demo page **so that** I can compare the rendering and confirm sticky headers work.

**Acceptance Criteria:**
- [ ] Demo page includes a `GridTableDemo` section with the same dataset used for `BasicTable`.
- [ ] Scrolling within `GridTableDemo` keeps the header row pinned.
- [ ] Visually verified in browser.

## Functional Requirements

- FR-1: `useDynamicFont` must debounce `prepare()` with a configurable delay (`{ debounceMs?: number }`, default 150 ms) and run `layout()` immediately on each font change using the prior prepared state.
- FR-2: `useDynamicFont` must return `{ rowHeights: number[], setFont: (font: string) => void, currentFont: string }`.
- FR-3: `useExportCanvas` must render all rows (full dataset, not just virtual window) to an offscreen canvas using only pretext geometry.
- FR-4: `useExportCanvas` must return `{ exportCanvas: () => Promise<Blob> }` with `image/png` MIME type.
- FR-5: `useSearch` must return `{ filteredRows: Row[], matchCoords: MatchCoordMap[] }` where coordinates are derived from `layoutWithLines()`.
- FR-6: `useSearch` must be case-insensitive and treat empty query as "show all rows".
- FR-7: `useMeasure` must accept an optional `options` parameter `{ whiteSpace?: 'pre-wrap' }` and forward it to pretext.
- FR-8: `GridTable` must use `display: grid` for all layout — no HTML table elements.
- FR-9: All new hooks must be exported from `src/shared/hooks/index.ts`; `GridTable` must be exported from `src/tables/index.ts`.
- FR-10: No font strings may be inlined — all fonts must come from `src/shared/fonts.ts`.
- FR-11: No DOM measurement (`getBoundingClientRect`, `offsetHeight`, `ResizeObserver` for cell sizing) may be used in any new hook or component.

## Non-Goals (Out of Scope)

- Server-side rendering (SSR) support for any new hook.
- Accessibility / ARIA roles for `GridTable` (deferred to a future iteration).
- Pagination or infinite scroll within `GridTable`.
- `useSearch` providing fuzzy matching — only case-insensitive substring matching.
- `useExportCanvas` supporting custom themes or CSS variables in the exported image.
- Drag handles or column resizing within `GridTable` (that is `ResizableTable`'s concern).
- Any changes to `BasicTable`, `ExpandableTable`, `ResizableTable`, `VirtualizedTable`, or `DraggableTable` beyond the `useMeasure` `whiteSpace` option.

## Open Questions

_All resolved — none remaining._

### Resolved
- **`useDynamicFont` debounce delay:** Configurable via `{ debounceMs?: number }`, defaulting to 150 ms. FR-1 updated to reflect this.
- **`useExportCanvas` font:** Always uses the font string passed at hook construction time. No per-call override.
- **`GridTable` minimum column width:** Column widths are fully controlled by the consumer — no `minColumnWidth` prop.
