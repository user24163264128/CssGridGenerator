/**
 * Grid selection utilities.
 * - Check if a set of cells forms a rectangle.
 * - Expand selection to bounding box (for non-rectangular selections).
 * - Split non-rectangular selection into multiple rectangular children (optional).
 */

import type { GridCell } from '../types';

/** Unique key for a cell. */
export function cellKey(cell: GridCell): string {
  return `${cell.row},${cell.column}`;
}

/** Set of cell keys for fast lookup. */
export function cellKeySet(cells: GridCell[]): Set<string> {
  return new Set(cells.map(cellKey));
}

/**
 * Check if the given cells form a single rectangle (contiguous, axis-aligned).
 * Algorithm: compute min/max row and column; count cells; compare with (maxRow - minRow + 1) * (maxCol - minCol + 1).
 */
export function isRectangularSelection(cells: GridCell[]): boolean {
  if (cells.length === 0) return false;
  const rows = cells.map((c) => c.row);
  const cols = cells.map((c) => c.column);
  const minR = Math.min(...rows);
  const maxR = Math.max(...rows);
  const minC = Math.min(...cols);
  const maxC = Math.max(...cols);
  const expectedCount = (maxR - minR + 1) * (maxC - minC + 1);
  return cells.length === expectedCount;
}

/**
 * Expand selection to the bounding box (min row..max row, min col..max col).
 * Use when user selects a non-rectangular region and we want one child covering the full box.
 */
export function expandToBoundingBox(cells: GridCell[]): GridCell[] {
  if (cells.length === 0) return [];
  const rows = cells.map((c) => c.row);
  const cols = cells.map((c) => c.column);
  const minR = Math.min(...rows);
  const maxR = Math.max(...rows);
  const minC = Math.min(...cols);
  const maxC = Math.max(...cols);
  const result: GridCell[] = [];
  for (let r = minR; r <= maxR; r++) {
    for (let c = minC; c <= maxC; c++) {
      result.push({ row: r, column: c });
    }
  }
  return result;
}

/**
 * Split a set of cells into one or more rectangular regions.
 * Greedy row-sweep: for each row, find contiguous column runs and try to extend them into rectangles.
 * Returns array of GridCell[] each forming a rectangle (used for auto-splitting into multiple children).
 */
export function splitIntoRectangles(cells: GridCell[]): GridCell[][] {
  if (cells.length === 0) return [];
  const set = cellKeySet(cells);
  const result: GridCell[][] = [];

  function has(r: number, c: number): boolean {
    return set.has(`${r},${c}`);
  }

  function removeRegion(region: GridCell[]): void {
    region.forEach((cell) => set.delete(cellKey(cell)));
  }

  while (set.size > 0) {
    const [firstKey] = set;
    const [r0, c0] = firstKey.split(',').map(Number);
    // Grow rectangle: extend right then down as much as possible
    let cEnd = c0;
    while (has(r0, cEnd + 1)) cEnd++;
    let rEnd = r0;
    rowLoop: while (true) {
      for (let c = c0; c <= cEnd; c++) {
        if (!has(rEnd + 1, c)) break rowLoop;
      }
      rEnd++;
    }
    const region: GridCell[] = [];
    for (let r = r0; r <= rEnd; r++) {
      for (let c = c0; c <= cEnd; c++) {
        if (has(r, c)) {
          region.push({ row: r, column: c });
        }
      }
    }
    removeRegion(region);
    result.push(region);
  }

  return result;
}
