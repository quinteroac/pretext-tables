# Requirement: Five Shared Hooks — useDetachable, useMediaCells, useSpanningCell, useEditable, useCellNotes

## Context
The existing hook layer (`useMeasure`, `useResizable`, `useExpandable`) covers static, resizable, and container-responsive tables. Five new interaction patterns have been identified — child-row expansion, media-enriched cells, spanning side columns, inline editing, and cell notes — each requiring a dedicated hook. All hooks must pre-compute heights via `@chenglou/pretext` with zero DOM measurement and must be demoed on the project demo page.

## Goals
- Add `useDetachable` so developers can expand a row into a child table panel without recursive measurement.
- Add `useMediaCells` so rows can mix text with images/video of known dimensions, keeping row heights fully computable.
- Add `useSpanningCell` so consumers can render a full-height side column (chart, timeline, viz) pixel-aligned to every row.
- Add `useEditable` so inline editing updates row height synchronously per keystroke with no DOM reflow.
- Add `useCellNotes` so tooltip/note content is pre-measured and positioned correctly on its first paint.
- Demonstrate every hook with a working interactive example on the demo page.

## User Stories

### US-001: useDetachable — expand a row into a child table panel
**As a** developer, **I want** a `useDetachable` hook that manages expand/collapse state for rows that open a child table, **so that** I can render nested data without recursive measurement or DOM reflows.

**Acceptance Criteria:**
- [ ] `useDetachable({ getChildRows })` returns `{ expandedRows: Set<string>, toggle(rowId): void, getChildRows(row): Row[] }`.
- [ ] Parent and child table each use independent `useMeasure` instances — no shared or recursive measurement.
- [ ] Cells remain typed as `string[]`; child data is provided entirely via `getChildRows`.
- [ ] Toggling a row adds/removes it from `expandedRows` and triggers a child `useMeasure` call for the newly expanded rows.
- [ ] A demo section on the demo page shows a parent table where clicking a row expands an inline child table below it.
- [ ] Typecheck / lint passes.
- [ ] Visually verified in browser: expand/collapse works; child table rows have correct heights.

---

### US-002: useMediaCells — rows with text + media of known dimensions
**As a** developer, **I want** a `useMediaCells` hook that adds image/video rows whose heights are `textHeight + mediaHeight`, **so that** row heights remain fully pre-computed without any DOM measurement.

**Acceptance Criteria:**
- [ ] Hook accepts a `media` map keyed by `rowId`, each entry carrying `{ mediaHeight: number }` (or `{ width: number, aspectRatio: number }` for video, with `mediaHeight` derived as `width / aspectRatio`).
- [ ] Hook returns `{ mediaVisible: Record<string, boolean>, toggleMedia(rowId): void, getEffectiveRows(rows): Row[] }` where `getEffectiveRows` injects media-height padding into the relevant rows for `useMeasure`.
- [ ] When a row's media is hidden, `layout()` recalculates the collapsed height from the text alone — no `ResizeObserver`, no `getBoundingClientRect`.
- [ ] No DOM measurement of any kind is used to determine media dimensions — all dimensions come from props.
- [ ] A demo section shows a product-catalogue-style table with toggleable image previews; row heights expand/collapse correctly.
- [ ] Typecheck / lint passes.
- [ ] Visually verified in browser: media toggle changes row height without layout flash.

---

### US-003: useSpanningCell — full-height side column aligned to every row
**As a** developer, **I want** a `useSpanningCell` hook that exposes `totalHeight` and `offsets[]` derived from `useMeasure` output, **so that** I can render a chart or visualisation in a side column that is pixel-aligned with every row without measuring the DOM.

**Acceptance Criteria:**
- [ ] Hook accepts `rowHeights: number[]` (the output of `useMeasure`) and returns `{ totalHeight: number, offsets: number[] }`.
- [ ] `totalHeight` equals the sum of all `rowHeights` values.
- [ ] `offsets[i]` equals the cumulative sum of `rowHeights[0..i-1]` (i.e. the Y position of the top of row `i`).
- [ ] Values are derived from `computeTotalHeight()` / `computeOffsets()` already in `useVirtualization.ts` — the hook is a thin wrapper; no new measurement logic is introduced.
- [ ] A `SpanningTable` demo component is added: two text columns + a spanning SVG chart that renders horizontal tick lines aligned with each row.
- [ ] Typecheck / lint passes.
- [ ] Visually verified in browser: chart ticks align with row boundaries at all row heights.

---

### US-004: useEditable — inline editing with live per-keystroke row height updates
**As an** end user, **I want** the row height to expand smoothly as I type in a cell, **so that** there is no layout jump or frame delay while editing.

**Acceptance Criteria:**
- [ ] `useEditable({ rows, columnWidths })` returns `{ previewHeights: number[], getEditProps(rowIndex, colIndex): object }`.
- [ ] `getEditProps` spreads onto a `<textarea>` or `contenteditable`; on every `input` event, `layout()` runs on the current value and `previewHeights` updates in the same frame.
- [ ] `prepare()` is debounced (~150 ms) to avoid the expensive canvas pass on every keystroke; `layout()` runs against the previous prepared state during the debounce window.
- [ ] `useEditable` is composable with `useResizable`: the `columnWidths` passed in may come from `useResizable`, and the resized widths are honoured during editing.
- [ ] No `ResizeObserver`, `getBoundingClientRect`, or any DOM measurement is used to determine preview heights.
- [ ] A demo section shows an editable table where typing causes the row to smoothly grow/shrink.
- [ ] Typecheck / lint passes.
- [ ] Visually verified in browser: row height updates on every keystroke with no visible delay or jump.

---

### US-005: useCellNotes — pre-measured tooltip notes with zero repositioning flash
**As an** end user, **I want** to hover a cell and see a note/tooltip whose position is correct on the first paint, **so that** there is no repositioning flicker after mount.

**Acceptance Criteria:**
- [ ] `useCellNotes({ notes: Record<"rowId:colIndex", string>, columnWidths, tooltipWidth })` pre-measures all note texts with `prepare()` alongside the main table and returns `{ getNoteTriggerProps(rowIndex, colIndex): object, NoteTooltip: React.FC<…> }`.
- [ ] Tooltip height is known before mount; no second-paint position correction occurs.
- [ ] `getNoteTriggerProps` returns `onMouseEnter` / `onMouseLeave` handlers; `NoteTooltip` renders the active note at the pre-computed position.
- [ ] No DOM measurement (`getBoundingClientRect`, `offsetHeight`, etc.) is used for tooltip sizing or positioning.
- [ ] A demo section shows a table with several cells annotated; hovering each cell opens a tooltip that appears at the correct position immediately.
- [ ] Typecheck / lint passes.
- [ ] Visually verified in browser: tooltip appears at correct position on first frame with no repositioning flash.

---

## Functional Requirements

- FR-1: All five hooks reside in `src/shared/hooks/` following existing naming and export conventions.
- FR-2: Each hook is exported from `src/shared/hooks/index.ts`.
- FR-3: No hook may call `getBoundingClientRect`, `offsetHeight`, `scrollHeight`, `ResizeObserver`, or any other DOM measurement API for the purpose of sizing rows or tooltips.
- FR-4: No hook may import or depend on external libraries beyond `@chenglou/pretext` and React.
- FR-5: Font constants used inside hooks must come from `src/shared/fonts.ts`; no inline font strings are permitted.
- FR-6: `prepare()` must never be called inside a render function or an effect without stable dependencies — all hooks must batch `prepare()` in a `useMemo` or equivalent stable-dependency path.
- FR-7: Each hook must have a corresponding demo section in the demo page (`src/demo/`).
- FR-8: `useSpanningCell` must delegate height-summation to the already-implemented `computeTotalHeight()` / `computeOffsets()` utilities rather than re-implementing them.
- FR-9: `useEditable`'s `prepare()` debounce window must be configurable (default 150 ms) via an options argument.
- FR-10: `useCellNotes` must accept `tooltipWidth` as a required prop so that tooltip height is deterministic before mount.

## Non-Goals (Out of Scope)
- Arbitrary JSX inside cells — only plain `string[]` cell content is supported.
- Server-side rendering (SSR) support for any of the five hooks.
- Drag-and-drop of notes or media items.
- Animations or CSS transitions on row height changes (smooth CSS transition is acceptable but not required).
- Accessibility (ARIA) attributes beyond what already exists in the codebase.
- Unit tests (demo-page visual verification is the acceptance bar for this iteration).

## Open Questions
- None
