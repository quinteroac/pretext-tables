# pretext-tables

A collection of UI table components powered by [`@chenglou/pretext`](https://github.com/chenglou/pretext) for precise, reflow-free text measurement and layout.

## What this is

Standard HTML tables rely on the browser's layout engine to size cells around text content. This project takes a different approach: each table measures its text with `pretext` before rendering, so cell heights are known up front — no layout thrash, no reflows, no surprises.

## Why pretext

`@chenglou/pretext` separates text measurement from layout into two cheap phases:

- **`prepare()`** — measures text once using the Canvas font engine (~19 ms / 500 texts)
- **`layout()`** — pure arithmetic line-breaking, zero DOM (~0.09 ms / text)

This makes it practical to size dozens or hundreds of table cells accurately before a single pixel is painted.

## Skills

This project ships three Claude Code skills for working with pretext:

| Skill | Description |
|---|---|
| `/pretext-docs` | Full API reference for `@chenglou/pretext` |
| `/pretext-integrate` | Integration guide — walks you through picking the right API for your use case |
| `/pretext-art` | Generates Canvas/SVG code for artistic text effects |
