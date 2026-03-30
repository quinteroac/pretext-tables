# Requirement: Demo Page Navigation Sidebar

## Context

The demo page (`src/demo/App.tsx`) is a single ~2800-line scrolling page showcasing ~20 sections — one per hook or table component. There is currently no navigation aid: users must scroll manually to find a section, with no indication of where they are. Both external developers evaluating the library and internal developers using it as a reference suffer from this.

This iteration adds a **fixed sidebar** with anchor links to every section, scrollspy highlighting of the currently-visible section, and a responsive hamburger menu for mobile viewports.

## Goals

- Allow any user to jump to any demo section in one click from anywhere on the page.
- Visually indicate which section is currently in view as the user scrolls (scrollspy).
- Keep the sidebar accessible on mobile via a collapsible hamburger panel.
- Avoid changing any table component logic — this is a pure demo-page UX change.

## User Stories

### US-001: Fixed sidebar with anchor links
**As a** developer browsing the demo page, **I want** a fixed sidebar listing all demo sections as clickable links **so that** I can jump to any section without scrolling through the entire page.

**Acceptance Criteria:**
- [ ] A sidebar is rendered to the left of the main content area and stays fixed while the page scrolls.
- [ ] The sidebar contains one link per demo section (all ~20 sections), labelled with the section's `h2` title (e.g. "useMeasure", "GridTable", "useSearch", …).
- [ ] Clicking a link scrolls the page smoothly to the corresponding section.
- [ ] Each `demo-section` element has a stable `id` attribute so anchor links resolve correctly (add `id` to any section that currently lacks one).
- [ ] The main content area is not obscured by the sidebar (correct layout margin/offset).
- [ ] Typecheck / lint passes.
- [ ] Visually verified in browser.

### US-002: Scrollspy — active section highlight
**As a** developer scrolling through the demo page, **I want** the sidebar link for the currently visible section to be visually highlighted **so that** I always know where I am on the page.

**Acceptance Criteria:**
- [ ] As the user scrolls, the sidebar link corresponding to the section nearest the top of the viewport receives an "active" visual state (e.g. distinct color, left-border accent, or bold weight — consistent with the existing demo design tokens).
- [ ] Only one link is active at a time.
- [ ] The active link updates smoothly as sections enter/leave the viewport (use `IntersectionObserver`).
- [ ] If no section is intersecting (e.g. before the first section), no link is active.
- [ ] Typecheck / lint passes.
- [ ] Visually verified in browser.

### US-003: Responsive hamburger menu (mobile)
**As a** developer on a mobile device or narrow viewport, **I want** the sidebar to collapse into a hamburger toggle **so that** the demo content is not obscured on small screens.

**Acceptance Criteria:**
- [ ] Below a breakpoint of **768 px**, the sidebar is hidden by default and a hamburger icon button appears (top-left or top-right, not overlapping the demo header).
- [ ] Tapping the hamburger opens the sidebar as an overlay or slide-in panel covering the content.
- [ ] Tapping a link in the open panel navigates to the section and closes the panel.
- [ ] Tapping outside the panel (or a dedicated close button) closes it without navigating.
- [ ] At ≥ 768 px, the hamburger is hidden and the sidebar is always visible (no toggle needed).
- [ ] Typecheck / lint passes.
- [ ] Visually verified in browser at a narrow viewport (≤ 375 px) and a wide viewport (≥ 1024 px).

## Functional Requirements

- FR-1: Every `demo-section` element in `App.tsx` must have a unique, stable `id` attribute (kebab-case of the section title, e.g. `id="use-measure"`, `id="grid-table"`).
- FR-2: The sidebar component must derive its link list from the same source of truth used to assign `id`s — a single `SECTIONS` constant — so adding a new section only requires one edit.
- FR-3: Scrollspy must use `IntersectionObserver` (not `scroll` event polling) for performance.
- FR-4: The sidebar must not import any table components or hooks — it is a pure UI/navigation concern.
- FR-5: Sidebar styles must be added to `demo.css` (or a co-located `sidebar.css` imported in `demo.css`) — no inline style objects except for dynamic values.
- FR-6: The active-section highlight must use CSS classes, not JavaScript style mutation.
- FR-7: The hamburger toggle must be keyboard-accessible (`aria-expanded`, `aria-controls`, focusable button).

## Non-Goals (Out of Scope)

- Searching/filtering sections from the sidebar.
- Collapsible section groups or nested navigation hierarchy.
- Changing any table component, hook, or test file.
- Persisting the last-visited section across page reloads.
- Animating the scroll (beyond `scroll-behavior: smooth` on `html`).

## Open Questions

- None.
