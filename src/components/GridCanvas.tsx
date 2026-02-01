/**
 * Grid Canvas: visual grid with click+drag selection and child overlays.
 * Each cell is a div; selection and children are highlighted.
 */

import { useCallback, useMemo } from 'react';
import type { GridCell, GridChild } from '../types';
import { cellKey } from '../utils/selection';

const CHILD_COLORS = [
  '#5c7cfa',
  '#51cf66',
  '#ffd43b',
  '#ff922b',
  '#ff6b6b',
  '#cc5de8',
  '#339af0',
  '#20c997',
];

function getChildColor(index: number): string {
  return CHILD_COLORS[index % CHILD_COLORS.length];
}

interface GridCanvasProps {
  rowCount: number;
  columnCount: number;
  children: GridChild[];
  selectedChildId: string | null;
  pendingSelection: GridCell[];
  isSelecting: boolean;
  onStartSelection: (cell: GridCell) => void;
  onAddToSelection: (cell: GridCell) => void;
  onEndSelection: () => void;
}

export function GridCanvas({
  rowCount,
  columnCount,
  children,
  selectedChildId,
  pendingSelection,
  isSelecting,
  onStartSelection,
  onAddToSelection,
  onEndSelection,
}: GridCanvasProps) {
  const pendingSet = useMemo(
    () => new Set(pendingSelection.map((c) => cellKey(c))),
    [pendingSelection]
  );

  const childByCell = useMemo(() => {
    const map = new Map<string, { child: GridChild; color: string }>();
    children.forEach((child, i) => {
      const color = getChildColor(i);
      child.cells.forEach((c) => map.set(cellKey(c), { child, color }));
    });
    return map;
  }, [children]);

  const selectedChild = useMemo(
    () => children.find((c) => c.id === selectedChildId),
    [children, selectedChildId]
  );
  const selectedCellSet = useMemo(
    () =>
      selectedChild
        ? new Set(selectedChild.cells.map((c) => cellKey(c)))
        : new Set<string>(),
    [selectedChild]
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent, row: number, col: number) => {
      e.preventDefault();
      onStartSelection({ row, column: col });
    },
    [onStartSelection]
  );

  const handleMouseEnter = useCallback(
    (e: React.MouseEvent, row: number, col: number) => {
      if (e.buttons === 1 && isSelecting) {
        onAddToSelection({ row, column: col });
      }
    },
    [isSelecting, onAddToSelection]
  );

  const handleMouseUp = useCallback(() => {
    if (isSelecting) onEndSelection();
  }, [isSelecting, onEndSelection]);

  const handleMouseLeave = useCallback(() => {
    if (isSelecting) onEndSelection();
  }, [isSelecting, onEndSelection]);

  const gridStyle = useMemo(
    () => ({
      display: 'grid' as const,
      /* Rows auto-adjust: equal height (1fr), min 0 so they shrink when many rows */
      gridTemplateRows: `repeat(${rowCount}, minmax(0, 1fr))`,
      gridTemplateColumns: `repeat(${columnCount}, minmax(24px, 1fr))`,
      gap: 2,
      backgroundColor: '#2d323d',
      padding: 2,
      borderRadius: 8,
      width: '100%',
      height: '100%',
      minHeight: 120,
    }),
    [rowCount, columnCount]
  );

  return (
    <div
      className="app__canvas"
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
    >
      <div className="grid-wrapper" style={{ minHeight: 0 }}>
        <div style={gridStyle}>
        {Array.from({ length: rowCount }, (_, row) =>
          Array.from({ length: columnCount }, (_, col) => {
            const key = cellKey({ row, column: col });
            const isPending = pendingSet.has(key);
            const childInfo = childByCell.get(key);
            const isSelected = selectedCellSet.has(key);
            const bg = isPending
              ? 'rgba(92, 124, 250, 0.4)'
              : childInfo
                ? childInfo.color
                : '#252830';
            const border =
              isSelected
                ? '2px solid #fff'
                : isPending
                  ? '2px solid #5c7cfa'
                  : '1px solid #3d424d';

            return (
              <div
                key={key}
                role="gridcell"
                aria-rowindex={row + 1}
                aria-colindex={col + 1}
                data-row={row}
                data-col={col}
                style={{
                  backgroundColor: bg,
                  border,
                  borderRadius: 4,
                  minWidth: 32,
                  minHeight: 32,
                  cursor: isSelecting ? 'crosshair' : 'default',
                  opacity: childInfo ? 0.85 : 1,
                }}
                onMouseDown={(e) => handleMouseDown(e, row, col)}
                onMouseEnter={(e) => handleMouseEnter(e, row, col)}
              />
            );
          })
        )}
        </div>
      </div>
    </div>
  );
}
