# CSS Grid Layout Designer

A production-quality, front-end-only web app for visually designing CSS Grid layouts and generating clean, maintainable CSS and HTML. Built with React, TypeScript, and Vite.

## Features

- **Visual grid canvas** — Define rows and columns; click and drag to select cells and create child regions. The grid fills the full left panel and row heights auto-adjust.
- **Child management** — Auto-named children (child1, child2, …), rename, delete, and lock. Layer list in the Inspector with color swatches.
- **Selection validation** — Non-rectangular selections are expanded to a bounding box so every child is a valid rectangle.
- **Gaps & alignment** — Controls for `gap`, `row-gap`, `column-gap`, and `place-items`.
- **Named grid areas** — Toggle between line-based placement and `grid-template-areas` output.
- **Responsive breakpoints** — Desktop, Tablet, and Mobile with separate grid config and children per breakpoint; generates media queries.
- **Code output** — Live CSS and HTML with a copy-to-clipboard button; optional responsive (media query) output.
- **Productivity** — Undo/redo, JSON export/import, keyboard shortcuts.

## Tech Stack

- **React 19** + **TypeScript**
- **Vite 7**
- CSS Grid for the editor layout (no canvas element)
- Local state only (no backend)

## Getting Started

### Prerequisites

- Node.js 18+ (recommended: 20+)

### Install and run

```bash
npm install
npm run dev
```

Then open the URL shown in the terminal (e.g. http://localhost:5173).

### Build for production

```bash
npm run build
npm run preview
```

## How to Use

1. **Left panel (Canvas)** — Use +/- in the Inspector to change rows and columns. Click and drag on the grid to select cells; release to create a new child region.
2. **Right top (Inspector)** — Switch breakpoints, adjust gap and place-items, manage children (rename, lock, delete), and set justify-self/align-self for the selected child.
3. **Right bottom (Code)** — View generated CSS and HTML, switch between CSS/HTML tabs, enable “Responsive” for media queries, and use “Copy to clipboard”.
4. **Toolbar** — Undo, Redo, Export JSON, Import JSON.

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| **Ctrl/Cmd + Z** | Undo |
| **Ctrl/Cmd + Shift + Z** | Redo |
| **Delete** / **Backspace** | Delete selected child (when not focused in an input) |
| **Escape** | Clear selection / deselect child |

## Project Structure

```
src/
  components/     GridCanvas, InspectorPanel, CodeOutputPanel
  hooks/          useGridState (layout state + undo/redo)
  types/          Grid, GridCell, GridChild, breakpoints, LayoutState
  utils/          selection (bounding box, rectangles), codegen (CSS/HTML)
  styles/         reset.css, app.css
```

## State Schema

See `src/types/grid.ts` for the full type definitions:

- **GridDefinition** — row/column counts, track sizes, gaps, `placeItems`
- **GridCell** — `{ row, column }` (0-based indices)
- **GridChild** — `id`, `name`, `cells`, `locked`, `areaName`, `justifySelf`, `alignSelf`
- **LayoutState** — `activeBreakpoint`, `breakpoints` (desktop/tablet/mobile configs)
- **LayoutExport** — versioned JSON format for export/import

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm run lint` | Run ESLint |

## License

MIT (or your preferred license).
