# Requirement: Resizable Auto-Adaptive Table

## Context
Developers need a table component where columns can be resized by the user and cell heights automatically recompute using `@chenglou/pretext` — without DOM reflows, `getBoundingClientRect`, or layout thrash. The component must follow the project's core rule: `prepare()` is called outside the render cycle.

## Goals
- Provide a production-ready, resizable table component that uses pretext for all cell height calculations.
- Ensure column resize events trigger a new `prepare()` pass rather than DOM measurement.
- Keep the API simple enough for a developer to drop in with minimal configuration.

## User Stories

### US-001: Render table with auto-computed cell heights
**As a** developer, **I want** to pass rows of text data to `ResizableTable` **so that** cell heights are computed by pretext at the correct column width before the first render.

**Acceptance Criteria:**
- [ ] Component accepts a `columns` prop (array of `{ key, header, width }`) and a `rows` prop (array of records).
- [ ] On mount, `prepare()` is called for each cell using the initial column width — no `getBoundingClientRect` used.
- [ ] All text fits within its cell without overflow or clipping.
- [ ] Typecheck / lint passes.
- [ ] Visually verified in browser: rows render with correct heights on first paint.

### US-002: Resize columns and recompute heights without DOM reflow
**As a** developer, **I want** to drag a column resize handle **so that** cell heights in that column recompute via pretext using the new width.

**Acceptance Criteria:**
- [ ] A drag handle is rendered at the right edge of each column header.
- [ ] Dragging the handle updates the column width in state.
- [ ] On width change, `prepare()` is called again for affected cells (via `useMemo` or equivalent stable dependency).
- [ ] No `getBoundingClientRect`, `offsetHeight`, or DOM measurement is used during resize.
- [ ] Rows reflowed to correct heights after resize without full page reflow.
- [ ] Typecheck / lint passes.
- [ ] Visually verified in browser: dragging a column handle re-wraps text and adjusts row heights smoothly.

### US-003: Table adapts to container width on initial layout
**As a** developer, **I want** the table to distribute column widths proportionally to the container **so that** it fills the available width without horizontal scroll on load.

**Acceptance Criteria:**
- [ ] If no explicit `width` is set on a column, widths are distributed evenly to fill the container.
- [ ] `prepare()` is called once with the resolved widths before render.
- [ ] Typecheck / lint passes.
- [ ] Visually verified in browser: table fills container width on load.

## Functional Requirements
- FR-1: All `prepare()` and `layout()` calls must live in `measure.ts`, not in the component render function.
- FR-2: Column widths must be stored in React state so changes are tracked and trigger a stable `useMemo` dependency.
- FR-3: Font constants must be imported from `src/shared/fonts.ts`; no inline font strings allowed.
- FR-4: The component must wait for `document.fonts.ready` before calling `prepare()` for the first time.
- FR-5: The component must be exported from `src/tables/index.ts`.
- FR-6: Only React and `@chenglou/pretext` may be used — no additional layout or measurement libraries.
- FR-7: There is no minimum column width constraint; columns can be resized to any width the user drags to.

## Non-Goals (Out of Scope)
- Virtualization / windowing of rows.
- Column sorting or filtering.
- Fixed/sticky header support.
- Server-side rendering (SSR).
- Row selection or editing.

## Open Questions
- None.
