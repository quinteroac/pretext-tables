# Audit — it_000003

## Executive Summary

All three hooks (`useStickyColumns`, `useInfiniteScroll`, `useCanvasCell`) are implemented and wired into the demo. `useStickyColumns` is fully compliant. `useInfiniteScroll` deviates from the specified API in FR-3 by adding a required `rowHeights` parameter. `useCanvasCell` is implementation-correct but its entire unit test suite fails in the `bun test` runner because `@chenglou/pretext` requires a Canvas/DOM context unavailable in Bun. A double-DPR scaling bug exists in the canvas demo integration.

---

## Verification by FR

| FR | Assessment | Notes |
|---|---|---|
| FR-1 | ✅ comply | Correct `{ frozenCount, columnWidths }` → `{ frozenWidths, scrollWidths }` signature. Pure `useMemo` slice, no state. |
| FR-2 | ✅ comply | Zero `prepare()` / `layout()` calls in `useStickyColumns.ts`. |
| FR-3 | ⚠️ partially_comply | Returns `{ onScroll, isLoading }` correctly, but input has an extra required `rowHeights: number[]` parameter absent from the PRD spec. |
| FR-4 | ✅ comply | Pure event/flag primitive — does not manage row state. Consumer appends rows after `onLoadMore` resolves. |
| FR-5 | ✅ comply | `useCanvasCell` accepts `{ prepared, columnWidths, options? }` and returns `{ drawCell }`. All types exported. |
| FR-6 | ✅ comply | No `prepare()` call. Positions from `layoutWithLines()` exclusively. `ctx.measureText` never called (verified by grep). |
| FR-7 | ✅ comply | `StickyColumnShowcase` calls `useStickyColumns({ frozenCount: 1, columnWidths: visibleWidths })`. No bespoke width-partition logic. |
| FR-8 | ✅ comply | All three hooks + helpers + types exported from `src/shared/hooks/index.ts`. |
| FR-9 | ✅ comply | `src/tables/` unchanged — no new table component added. |
| FR-10 | ✅ comply | `useCanvasCell` defaults to `BODY_FONT` from `src/shared/fonts.ts`. No inline font strings. |

---

## Verification by US

| US | Assessment | Notes |
|---|---|---|
| US-001 | ✅ comply | All 7 ACs satisfied. 8/8 unit tests pass. AC06 test (`[100,120,80,60]` + `frozenCount=2`) passes. |
| US-002 | ✅ comply | Showcase uses `useStickyColumns`. `frozenWidths.concat(scrollWidths)` drives single `useMeasure` call (AC03). No new `src/tables/` component (AC05). TypeScript strict passes (AC07). |
| US-003 | ⚠️ partially_comply | AC01 partially fails: actual interface is `{ onLoadMore, threshold?, rowHeights }` — `rowHeights` is required but absent from the spec. All other ACs (AC02–AC09) are satisfied: default threshold 200 px, `isLoading` flag, loading guard, no row state, no DOM sizing. 17/17 tests pass. |
| US-004 | ⚠️ partially_comply | AC01–AC05, AC07 satisfied by implementation. AC06 (unit tests verifying `fillText` positions match `layoutWithLines`) fails in `bun test` — `@chenglou/pretext`'s `prepareWithSegments` throws because Bun lacks Canvas API. All 13 `useCanvasCell` tests fail for this reason. Hook code itself is correct. |
| US-005 | ✅ comply | All three demo sections present: sticky-column (AC01), infinite-scroll with loading spinner (AC02), canvas with gradient effect (AC03). TypeScript strict passes (AC06). |

---

## Minor Observations

1. **useCanvasCell tests fail in Bun** — `@chenglou/pretext`'s `prepareWithSegments` calls `getMeasureContext()` which requires `OffscreenCanvas` or `document.createElement('canvas')`, neither available in Bun's test runner. All 13 tests in `src/tests/useCanvasCell.test.ts` fail.

2. **useInfiniteScroll API deviation** — the PRD specifies `useInfiniteScroll({ onLoadMore, threshold? })` but the implementation requires `rowHeights: number[]`. This was introduced to avoid reading `scrollHeight` from the DOM (AC07 compliance). The PRD / JSDoc should document this parameter.

3. **Double-DPR scaling bug in `CanvasCellDemo`** — `drawCell` is invoked as `drawCell(ctx, ri, ci, x * dpr, y * dpr, dpr)`. The hook applies `ctx.scale(dpr, dpr)` internally, so coordinates get multiplied by `dpr²` on HiDPI devices. Correct call: `drawCell(ctx, ri, ci, x, y, dpr)` (logical coordinates, let the hook scale).

4. **No frozen/scrollable pane visual separator** — the sticky-column demo has no border or shadow between the frozen and scrollable panes, which may cause visual ambiguity at the freeze boundary.

5. **Canvas table has no accessible fallback** — `useCanvasCell` renders text purely onto `<canvas>` with no ARIA alternative. Library documentation should recommend an offscreen or visually-hidden `<table>` for screen-reader users.

---

## Conclusions and Recommendations

The iteration delivers its three hook primitives in solid shape overall. `useStickyColumns` is production-quality. `useInfiniteScroll` is functionally correct but its API diverges from the spec. `useCanvasCell` is implementation-correct but untestable in the current CI environment and has a double-scaling integration bug.

**Recommended actions (priority order):**

1. **(Critical)** Fix double-DPR scaling in `CanvasCellDemo` — change `drawCell(ctx, ri, ci, x * dpr, y * dpr, dpr)` → `drawCell(ctx, ri, ci, x, y, dpr)`.
2. **(High)** Fix `useCanvasCell` test environment — configure vitest/bun with `jsdom` or `happy-dom` for `src/tests/useCanvasCell.test.ts`, or replace `prepareWithSegments` calls with a hand-crafted `PreparedTextWithSegments` fixture.
3. **(Medium)** Update FR-3 / US-003-AC01 JSDoc (or the PRD) to formally document the `rowHeights` parameter in `useInfiniteScroll`.
4. **(Low)** Add a visible divider (border or box-shadow) between frozen and scrollable panes in the sticky-column demo.
5. **(Low)** Add accessibility guidance to `useCanvasCell` docs — canvas renders require an ARIA-labelled fallback table.

---

## Refactor Plan

### 1. Fix double-DPR scaling in `CanvasCellDemo` (src/demo/App.tsx)

**File:** `src/demo/App.tsx` — `CanvasCellDemo` component, paint loop (~line 1455)

**Change:**
```diff
- drawCell(ctx, ri, ci, x * dpr, y * dpr, dpr)
+ drawCell(ctx, ri, ci, x, y, dpr)
```

**Why:** `useCanvasCell`'s `createDrawCell` calls `ctx.scale(dpr, dpr)` internally before drawing. Passing `x * dpr` as coordinates causes positions to be scaled by `dpr²` on HiDPI screens. Passing logical coordinates (`x`, `y`) lets the hook perform the single correct scale.

---

### 2. Fix useCanvasCell test environment

**File:** `vitest.config.ts` (or `vitest.config.mts`) — add environment override for canvas tests

**Approach A — per-file vitest environment docblock** (preferred, no config change):
Add at the top of `src/tests/useCanvasCell.test.ts`:
```ts
// @vitest-environment jsdom
```
Then install `jsdom` if not already a dev dependency.

**Approach B — config-level environment for canvas tests:**
```ts
// vitest.config.ts
environmentMatchGlobs: [
  ['src/tests/useCanvasCell.test.ts', 'jsdom'],
]
```

**Why:** `prepareWithSegments` requires `document.createElement('canvas').getContext('2d')` which exists in jsdom/happy-dom but not in Bun's default test environment.

---

### 3. Update useInfiniteScroll JSDoc for rowHeights (src/shared/hooks/useInfiniteScroll.ts)

Add a clear note to `UseInfiniteScrollOptions` and the hook docstring that `rowHeights` is intentionally required to avoid `scrollHeight` DOM reads, and show the canonical wiring with `useMeasure`.
