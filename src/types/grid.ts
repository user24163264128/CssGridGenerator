/**
 * CSS Grid Layout Designer — Type definitions
 * Core state schema for grid, cells, children, and breakpoints.
 */

/** Single grid cell identified by row and column index (0-based). */
export interface GridCell {
  row: number;
  column: number;
}

/** Track size: fr | px | % | auto | minmax(min, max). */
export type TrackSize =
  | { type: 'fr'; value: number }
  | { type: 'px'; value: number }
  | { type: 'percent'; value: number }
  | { type: 'auto' }
  | { type: 'minmax'; min: string; max: string };

/** place-items: align-items justify-items. */
export type PlaceItems =
  | 'start'
  | 'end'
  | 'center'
  | 'stretch'
  | 'normal';

/** Grid definition: rows, columns, gaps, alignment. */
export interface GridDefinition {
  rowCount: number;
  columnCount: number;
  rowSizes: TrackSize[];
  columnSizes: TrackSize[];
  gap: number;
  rowGap: number;
  columnGap: number;
  placeItems: PlaceItems;
}

/** A child region: named area with selected cells, optional area name for template-areas. */
export interface GridChild {
  id: string;
  name: string;
  /** Cells belonging to this child (should form a rectangle for line-based placement). */
  cells: GridCell[];
  locked: boolean;
  /** For area-based mode: name used in grid-template-areas. */
  areaName?: string;
  /** Self alignment (optional). */
  justifySelf?: 'start' | 'end' | 'center' | 'stretch';
  alignSelf?: 'start' | 'end' | 'center' | 'stretch';
}

/** Breakpoint identifier. */
export type BreakpointId = 'desktop' | 'tablet' | 'mobile';

/** Per-breakpoint config: grid + children. */
export interface BreakpointConfig {
  grid: GridDefinition;
  children: GridChild[];
}

/** Full layout state: current breakpoint + configs per breakpoint. */
export interface LayoutState {
  activeBreakpoint: BreakpointId;
  breakpoints: Record<BreakpointId, BreakpointConfig>;
}

/** History entry for undo/redo (snapshot of LayoutState). */
export interface HistoryEntry {
  state: LayoutState;
  timestamp: number;
}

/** Export/import: layout state + optional metadata. */
export interface LayoutExport {
  version: 1;
  layout: LayoutState;
  exportedAt: string;
}

/** Default track size factory. */
export function defaultTrackSize(): TrackSize {
  return { type: 'fr', value: 1 };
}

/** Create default grid definition. */
export function defaultGridDefinition(
  rowCount = 3,
  columnCount = 4
): GridDefinition {
  return {
    rowCount,
    columnCount,
    rowSizes: Array.from({ length: rowCount }, () => defaultTrackSize()),
    columnSizes: Array.from({ length: columnCount }, () => defaultTrackSize()),
    gap: 16,
    rowGap: 16,
    columnGap: 16,
    placeItems: 'stretch',
  };
}

/** Create empty breakpoint config. */
export function defaultBreakpointConfig(
  rowCount = 3,
  columnCount = 4
): BreakpointConfig {
  return {
    grid: defaultGridDefinition(rowCount, columnCount),
    children: [],
  };
}

/** Create initial layout state. */
export function defaultLayoutState(): LayoutState {
  return {
    activeBreakpoint: 'desktop',
    breakpoints: {
      desktop: defaultBreakpointConfig(3, 4),
      tablet: defaultBreakpointConfig(3, 3),
      mobile: defaultBreakpointConfig(4, 2),
    },
  };
}
