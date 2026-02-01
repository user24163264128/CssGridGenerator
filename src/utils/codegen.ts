/**
 * CSS and HTML code generation for the grid layout.
 * Produces clean, minimal, readable output for parent grid and children.
 */

import type {
  GridDefinition,
  GridChild,
  GridCell,
  TrackSize,
  PlaceItems,
  BreakpointId,
  BreakpointConfig,
  LayoutState,
} from '../types';

/** Format a single track size for CSS. */
function formatTrackSize(size: TrackSize): string {
  switch (size.type) {
    case 'fr':
      return `${size.value}fr`;
    case 'px':
      return `${size.value}px`;
    case 'percent':
      return `${size.value}%`;
    case 'auto':
      return 'auto';
    case 'minmax':
      return `minmax(${size.min}, ${size.max})`;
    default:
      return '1fr';
  }
}

/** Format place-items value. */
function formatPlaceItems(p: PlaceItems): string {
  return p === 'normal' ? 'normal' : p;
}

/** Sanitize name for use as CSS class (e.g. replace spaces with hyphen). */
function toClassName(name: string): string {
  return name.trim().replace(/\s+/g, '-') || 'child';
}

/** Generate CSS for the parent grid (display, template-rows/columns, gap, place-items). */
export function generateParentGridCSS(
  grid: GridDefinition,
  parentClass: string = 'parent'
): string {
  const cls = toClassName(parentClass);
  const rows =
    grid.rowSizes.length === grid.rowCount
      ? grid.rowSizes.map(formatTrackSize).join(' ')
      : `repeat(${grid.rowCount}, 1fr)`;
  const cols =
    grid.columnSizes.length === grid.columnCount
      ? grid.columnSizes.map(formatTrackSize).join(' ')
      : `repeat(${grid.columnCount}, 1fr)`;

  const gap =
    grid.rowGap === grid.columnGap && grid.rowGap === grid.gap
      ? `  gap: ${grid.gap}px;`
      : `  row-gap: ${grid.rowGap}px;\n  column-gap: ${grid.columnGap}px;`;

  const placeItems =
    grid.placeItems !== 'stretch'
      ? `\n  place-items: ${formatPlaceItems(grid.placeItems)};`
      : '';

  return `.${cls} {
  display: grid;
  grid-template-rows: ${rows};
  grid-template-columns: ${cols};
${gap}${placeItems}
}`;
}

/**
 * For a set of cells (must form rectangle), compute grid-row and grid-column (1-based line numbers).
 */
function getChildPlacement(cells: GridCell[]): { row: string; column: string } {
  if (cells.length === 0) return { row: 'auto', column: 'auto' };
  const rows = cells.map((c) => c.row);
  const cols = cells.map((c) => c.column);
  const rowStart = Math.min(...rows) + 1;
  const rowEnd = Math.max(...rows) + 2;
  const colStart = Math.min(...cols) + 1;
  const colEnd = Math.max(...cols) + 2;

  const row =
    rowEnd - rowStart === 1 ? `${rowStart}` : `${rowStart} / ${rowEnd}`;
  const col =
    colEnd - colStart === 1 ? `${colStart}` : `${colStart} / ${colEnd}`;
  return { row, column: col };
}

/** Generate CSS for a single child (grid-row, grid-column, optional justify/align-self). */
export function generateChildCSS(
  child: GridChild,
  childClass?: string
): string {
  const cls = toClassName(childClass ?? child.name);
  const { row, column } = getChildPlacement(child.cells);
  const self = [];
  if (child.justifySelf) self.push(`justify-self: ${child.justifySelf};`);
  if (child.alignSelf) self.push(`align-self: ${child.alignSelf};`);
  const selfStr = self.length ? '\n  ' + self.join('\n  ') : '';
  return `.${cls} {
  grid-row: ${row};
  grid-column: ${column};${selfStr}
}`;
}

/** Generate grid-template-areas string from children (by row). */
function generateTemplateAreas(
  rowCount: number,
  columnCount: number,
  children: GridChild[]
): string {
  const grid: (string | null)[][] = Array.from({ length: rowCount }, () =>
    Array(columnCount).fill(null)
  );
  for (const ch of children) {
    const areaName = toClassName(ch.areaName ?? ch.name);
    if (!areaName) continue;
    const rows = ch.cells.map((c) => c.row);
    const cols = ch.cells.map((c) => c.column);
    const minR = Math.min(...rows);
    const maxR = Math.max(...rows);
    const minC = Math.min(...cols);
    const maxC = Math.max(...cols);
    for (let r = minR; r <= maxR; r++) {
      for (let c = minC; c <= maxC; c++) {
        grid[r][c] = areaName;
      }
    }
  }
  return grid
    .map((row) => row.map((c) => c ?? '.').join(' '))
    .map((r) => `"${r}"`)
    .join('\n  ');
}

/** Generate parent CSS using grid-template-areas when all children have areaName. */
export function generateParentGridCSSWithAreas(
  grid: GridDefinition,
  children: GridChild[],
  parentClass: string = 'parent'
): string {
  const allHaveNames = children.length > 0;
  if (!allHaveNames) {
    return generateParentGridCSS(grid, parentClass);
  }
  const cls = toClassName(parentClass);
  const rows =
    grid.rowSizes.length === grid.rowCount
      ? grid.rowSizes.map(formatTrackSize).join(' ')
      : `repeat(${grid.rowCount}, 1fr)`;
  const cols =
    grid.columnSizes.length === grid.columnCount
      ? grid.columnSizes.map(formatTrackSize).join(' ')
      : `repeat(${grid.columnCount}, 1fr)`;
  const areas = generateTemplateAreas(
    grid.rowCount,
    grid.columnCount,
    children
  );
  const gap =
    grid.rowGap === grid.columnGap && grid.rowGap === grid.gap
      ? `  gap: ${grid.gap}px;`
      : `  row-gap: ${grid.rowGap}px;\n  column-gap: ${grid.columnGap}px;`;
  const placeItems =
    grid.placeItems !== 'stretch'
      ? `\n  place-items: ${formatPlaceItems(grid.placeItems)};`
      : '';

  return `.${cls} {
  display: grid;
  grid-template-areas:
  ${areas};
  grid-template-rows: ${rows};
  grid-template-columns: ${cols};
${gap}${placeItems}
}`;
}

/** Generate child CSS for area-based: grid-area only. */
export function generateChildCSSArea(
  child: GridChild,
  childClass?: string
): string {
  const cls = toClassName(childClass ?? child.name);
  const areaName = toClassName(child.areaName ?? child.name);
  if (!areaName) return generateChildCSS(child, cls);
  const self = [];
  if (child.justifySelf) self.push(`justify-self: ${child.justifySelf};`);
  if (child.alignSelf) self.push(`align-self: ${child.alignSelf};`);
  const selfStr = self.length ? '\n  ' + self.join('\n  ') : '';
  return `.${cls} {
  grid-area: ${areaName};${selfStr}
}`;
}

/** Generate full CSS for current breakpoint (line-based or area-based). */
export function generateFullCSS(
  config: BreakpointConfig,
  useAreas: boolean,
  parentClass: string = 'parent'
): string {
  const parent = useAreas
    ? generateParentGridCSSWithAreas(
        config.grid,
        config.children,
        parentClass
      )
    : generateParentGridCSS(config.grid, parentClass);
  const childGen = useAreas ? generateChildCSSArea : generateChildCSS;
  const childBlocks = config.children.map((ch) => childGen(ch)).join('\n\n');
  return parent + (childBlocks ? '\n\n' + childBlocks : '');
}

/** Generate HTML for current children. */
export function generateHTML(
  children: GridChild[],
  parentClass: string = 'parent'
): string {
  const cls = toClassName(parentClass);
  const items = children
    .map((ch) => `  <div class="${toClassName(ch.name)}"></div>`)
    .join('\n');
  return `<div class="${cls}">\n${items}\n</div>`;
}

/** Media query breakpoints (min-width). */
export const BREAKPOINT_MEDIA: Record<BreakpointId, string> = {
  desktop: '1200px',
  tablet: '768px',
  mobile: '0px',
};

/** Generate CSS with media queries for all breakpoints (mobile-first). */
export function generateResponsiveCSS(
  state: LayoutState,
  useAreas: boolean,
  parentClass: string = 'parent'
): string {
  const parts: string[] = [];
  const bpOrder: BreakpointId[] = ['mobile', 'tablet', 'desktop'];
  for (const bp of bpOrder) {
    const config = state.breakpoints[bp];
    const media = BREAKPOINT_MEDIA[bp];
    const block = generateFullCSS(config, useAreas, parentClass);
    if (bp === 'mobile') {
      parts.push(block);
    } else {
      parts.push(`@media (min-width: ${media}) {\n${block}\n}`);
    }
  }
  return parts.join('\n\n');
}
