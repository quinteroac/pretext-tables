# Requirement: BasicTable — First Pretext-Powered Table Component

## Context

The project has no table components yet. This iteration establishes the first working table component (`BasicTable`) that measures cell heights using `@chenglou/pretext` before rendering — eliminating DOM reflows and layout thrash. It also sets up the baseline file structure and a developer demo page.

## Goals

- Deliver a functional `BasicTable` component where all text measurement happens outside the render cycle via `@chenglou/pretext`.
- Validate the core project pattern: `prepare()` in `measure.ts`, render in `index.tsx`.
- Provide a working demo page so developers can visually verify the component.

## User Stories

### US-001: Import and mount BasicTable

**As a** developer, **I want** to import `<BasicTable>` and pass it an array of row data **so that** I can render a table without writing any measurement logic myself.

**Acceptance Criteria:**
- [ ] `BasicTable` is exported from `src/tables/index.ts`
- [ ] Component accepts a `rows` prop of type `{ id: string; cells: string[] }[]` and a `columnWidths` prop of type `number[]`
- [ ] Component renders without errors when mounted with valid props
- [ ] Typecheck (`tsc --noEmit`) passes
- [ ] Lint passes

---

### US-002: Cell heights computed by pretext before render

**As a** developer, **I want** cell heights to be calculated with `prepareWithSegments()` before the component renders **so that** there are no DOM reflows or calls to `getBoundingClientRect`.

**Acceptance Criteria:**
- [ ] All `prepareWithSegments()` calls live in `src/tables/basic-table/measure.ts`, not in the component file
- [ ] The component uses `useMemo` (or equivalent) to call the measure functions only when `rows` or `columnWidths` change
- [ ] No `getBoundingClientRect`, `offsetHeight`, or any DOM measurement API is used anywhere in the table code
- [ ] Typecheck and lint pass

---

### US-003: Multi-line text wrap in fixed-width columns

**As a** developer, **I want** cells with long text to wrap across multiple lines at the correct column width **so that** all content is visible without horizontal overflow.

**Acceptance Criteria:**
- [ ] Each cell's rendered height matches the number of wrapped lines as reported by `prepareWithSegments()`
- [ ] Text does not overflow horizontally beyond the specified `columnWidths` value
- [ ] Visually verified in browser: long-text cells expand vertically and content is fully readable
- [ ] Typecheck and lint pass

---

### US-004: Developer demo page

**As a** developer, **I want** a demo page that mounts `BasicTable` with realistic sample data **so that** I can visually inspect the component during development.

**Acceptance Criteria:**
- [ ] A demo entry point (e.g. `src/demo/App.tsx` or `index.html` with Vite) renders `BasicTable` with at least 10 rows and 3 columns
- [ ] At least one column contains text long enough to trigger multi-line wrapping
- [ ] The page loads in the browser without console errors
- [ ] Visually verified in browser: table displays correctly with proper row heights

---

## Functional Requirements

- FR-1: `BasicTable` must accept `rows: { id: string; cells: string[] }[]` and `columnWidths: number[]` as required props.
- FR-2: All `prepare()` and layout calls must reside in `src/tables/basic-table/measure.ts`.
- FR-3: Font constants used for measurement must be defined in `src/shared/fonts.ts` and imported — never inlined.
- FR-4: The component must wait for `document.fonts.ready` before executing any `prepare()` call.
- FR-5: `@chenglou/pretext` is the only permitted text-measurement library; no DOM APIs for sizing.

## Non-Goals (Out of Scope)

- Virtualization / windowing of rows (deferred to a future iteration).
- Sorting, filtering, or pagination.
- Editable cells.
- Responsive column resizing by the end user.
- Any table component other than `BasicTable`.

## Open Questions

- None
