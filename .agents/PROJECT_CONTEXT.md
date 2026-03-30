# Project Context

<!-- Created or updated by `nvst create project-context`. Cap: 250 lines. -->

## Conventions
- Naming: table components PascalCase (`BasicTable`); hooks `use`-prefixed camelCase; font/measure constants `SCREAMING_SNAKE_CASE`; CSS files co-located with component (`<table-name>.css`)
- Formatting: TypeScript strict mode; ESLint with `@typescript-eslint`; no enforced Prettier config committed
- Git flow: feature branches per iteration (`feature/it_XXXXXX`) inferred from standard practice
- Workflow: `prepare()` must never be called inside a component or render function — always goes through `useMeasure`

## Tech Stack
- Language: TypeScript 5.6 (strict)
- Runtime: Browser (Vite dev server / Bun for scripts)
- Frameworks: React 18
- Key libraries: `@chenglou/pretext ^0.0.3` (text measurement without DOM reflows)
- Package manager: Bun
- Build / tooling: Vite 5, `tsc --noEmit` for type-checking, ESLint 8 for linting

## Code Standards
- Style patterns: functional components only; hooks compose in components, never nested hooks
- Error handling: no explicit error boundaries required yet; TypeScript strict catches most issues at compile time
- Module organisation: barrel exports via `index.ts` at each layer (`src/shared/hooks/index.ts`, `src/tables/index.ts`)
- Forbidden patterns:
  - `prepare()` / `layout()` called directly in a component or render path
  - `getBoundingClientRect`, `offsetHeight`, or any DOM measurement for cell sizing
  - Inline font strings (must come from `src/shared/fonts.ts`)
  - `useExpandable` + drag handles in the same table
  - New abstractions for patterns appearing in fewer than 3 tables

## Testing Strategy
- Approach: code-first, tests for core logic (state machines, sort order, visibility state, hook contracts)
- Runner: Vitest 4 (`bun test` or `bun run vitest`)
- Environment: `node` (canvas polyfill in `src/tests/setup.ts`)
- Test location: `src/tests/<feature>.test.ts`
- Coverage targets: unit tests for each hook's critical state transitions

## Product Architecture
- Goal: UI table components whose cell heights are pre-computed by `@chenglou/pretext` before render — zero DOM reflows
- Three layers:
  1. **Primitives** (`src/shared/hooks/`) — stateful hooks (`useMeasure`, `useResizable`, `useExpandable`)
  2. **Table components** (`src/tables/<name>/`) — pre-composed, ready-to-use React components
  3. **Custom tables** — developers compose hooks directly for bespoke layouts
- Data flow: `rows` → sort/filter → `useMeasure(rows, columnWidths)` → `rowHeights[]` → render with fixed heights

## Modular Structure
- `src/shared/fonts.ts`: all font constant strings (`BODY_FONT`, `HEADER_FONT`, `MONO_FONT`)
- `src/shared/types.ts`: shared types (`Row = { id: string; cells: string[] }`)
- `src/shared/hooks/useMeasure.ts`: owns `prepare()`, `layout()`, `fontsReady`; returns `rowHeights[]`
- `src/shared/hooks/useResizable.ts`: drag state for column widths and row height overrides
- `src/shared/hooks/useExpandable.ts`: ResizeObserver wrapper; fires `onResize(w, h, prevW, prevH)`
- `src/tables/<name>/index.tsx`: component entry point — imports hooks only, no direct pretext calls
- `src/tables/<name>/measure.ts`: numeric constants only (`LINE_HEIGHT`, `CELL_PADDING`, `MIN_COLUMN_WIDTH`)
- `src/tables/index.ts`: barrel re-export of all table components
- `src/demo/`: demo page showcasing all table variants
- `src/tests/`: Vitest unit tests per feature

## Implemented Capabilities
<!-- Updated at the end of each iteration by nvst create project-context -->
- `BasicTable`: fixed column widths, no interaction
- `ExpandableTable`: proportional column scaling via ResizeObserver; container has `resize: horizontal`
- `ResizableTable`: drag handles for column widths and/or row height overrides
- `VirtualizedTable`: windowed rendering for large row counts
- `DraggableTable`: drag-and-drop row/column reordering
