# Audit — Iteration 000001

## Executive Summary

All 4 user stories and 5 functional requirements from iteration 000001 are satisfied. The BasicTable component correctly isolates `prepare()` calls in `measure.ts`, uses `useMemo` with stable dependencies, avoids all DOM measurement APIs, and waits for `document.fonts.ready`. 19 tests pass, typecheck and lint are clean. One partial compliance issue was found in FR-3: `basic-table.css` inlines a font string instead of referencing the shared `BODY_FONT` constant, creating a risk of drift between the measured and rendered font.

## Verification by FR

| FR | Assessment | Notes |
|---|---|---|
| FR-1 | comply | `BasicTable` accepts `rows: Row[]` and `columnWidths: number[]` as required props. |
| FR-2 | comply | All `prepareWithSegments()` and `layout()` calls live exclusively in `measure.ts`. |
| FR-3 | partially_comply | `BODY_FONT` is correctly used in `measure.ts`, but `basic-table.css` inlines `'14px Inter, sans-serif'` rather than referencing the shared constant. |
| FR-4 | comply | Component waits for `document.fonts.ready` via `useEffect` before enabling measurement. |
| FR-5 | comply | No `getBoundingClientRect`, `offsetHeight`, or any DOM sizing API in production code. |

## Verification by US

| US | Assessment | Notes |
|---|---|---|
| US-001 | comply | Exported, correct props, renders without errors, typecheck and lint pass. |
| US-002 | comply | `prepareWithSegments()` isolated in `measure.ts`, `useMemo` keyed correctly, no DOM APIs, 12 tests pass. |
| US-003 | comply | CSS prevents horizontal overflow, row heights driven by pretext line counts, 7 wrap tests pass. |
| US-004 | comply | Demo with 12 rows × 3 columns, long-text column triggers wrapping, Vite entry point in place. |

## Minor Observations

- `basic-table.css` duplicates the `BODY_FONT` value — drift risk if the font changes in `fonts.ts`.
- No `<thead>` / column header row in the rendered table (not required by PRD but useful for readability).
- Test files live in `src/tests/` rather than co-located with the component; consider establishing a consistent convention.

## Conclusions and Recommendations

The implementation is solid. The one actionable item is FR-3: inject the font as a CSS custom property so the measurement font and render font are guaranteed to stay in sync. A CSS variable `--basic-table-font` set inline on the `<table>` element (sourced from `BODY_FONT`) ensures a single source of truth without requiring CSS-to-TS imports.

## Refactor Plan

1. **`src/tables/basic-table/index.tsx`** — Add `style={{ '--basic-table-font': BODY_FONT } as React.CSSProperties}` to the `<table>` element, importing `BODY_FONT` from `src/shared/fonts.ts`.
2. **`src/tables/basic-table/basic-table.css`** — Replace `font: 14px Inter, sans-serif` with `font: var(--basic-table-font)` so the rendered font always matches the measured font.
3. Run `tsc --noEmit` and `eslint` to confirm no regressions.
