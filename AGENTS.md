# AGENTS.md — pretext-tables conventions

Guidelines for working on this project. Read this before writing or modifying code.

## Project purpose

Build a collection of UI table components where cell heights are computed with `@chenglou/pretext` before rendering — no DOM reflows, no `getBoundingClientRect`, no layout thrash.

---

## Core rule: prepare outside render

Every component must separate the `prepare()` call from the render cycle. This is the single most important constraint in this codebase.

```ts
// Correct — prepare once when data arrives
const prepared = useMemo(() => rows.map(r => prepareWithSegments(r.text, FONT)), [rows])

// Wrong — never do this
function Row({ text }) {
  const prepared = prepareWithSegments(text, FONT) // called on every render
}
```

If you touch a table component and `prepare()` is inside a render function or a `useEffect` that runs on every render, fix it before doing anything else.

---

## File structure

```
src/
  tables/
    <table-name>/
      index.tsx        # component entry point
      measure.ts       # all prepare() calls and layout logic live here
      <table-name>.css # scoped styles
  shared/
    fonts.ts           # font constants shared across tables
    types.ts           # shared TypeScript types
```

Each table is a self-contained directory. Do not put layout logic in the component file — keep it in `measure.ts`.

---

## Naming conventions

- Table components: PascalCase (`VirtualTable`, `MasonryTable`)
- Font constants: `SCREAMING_SNAKE_CASE` (`BODY_FONT`, `HEADER_FONT`)
- Prepared text variables: prefix with `prepared` (`preparedRows`, `preparedHeaders`)
- Layout result variables: prefix with `layout` or `lines` (`layoutResult`, `linesByRow`)

---

## Font constants

Define all fonts in `src/shared/fonts.ts`. Never hardcode font strings inside components.

```ts
export const BODY_FONT = '14px Inter, sans-serif'
export const HEADER_FONT = 'bold 14px Inter, sans-serif'
export const MONO_FONT = '13px "JetBrains Mono", monospace'
```

Wait for fonts before measuring:

```ts
await document.fonts.ready
// safe to call prepare() here
```

---

## Adding a new table

1. Create `src/tables/<table-name>/` with `index.tsx`, `measure.ts`, and a CSS file.
2. Put all `prepare()` and `layout()` calls in `measure.ts`.
3. Export a single component from `index.tsx`.
4. Add an entry to `src/tables/index.ts`.
5. Use font constants from `src/shared/fonts.ts` — do not inline font strings.

---

## What not to do

- Do not call `prepare()` in a render function, `useEffect` without a stable dependency, or `requestAnimationFrame` callback.
- Do not use `getBoundingClientRect`, `offsetHeight`, or any DOM measurement for cell sizing — that's what pretext replaces.
- Do not add a new font string without adding it to `src/shared/fonts.ts` first.
- Do not add abstractions for patterns used in only one table. Wait until a pattern appears in three or more tables before extracting it.

---

## Skills

Use the project skills when writing or debugging pretext code:

- `/pretext-docs` — API reference (function signatures, types, options)
- `/pretext-integrate` — guided integration patterns (virtual list, Canvas, SSR, shrink-wrap)
- `/pretext-art` — Canvas/SVG artistic text effects
