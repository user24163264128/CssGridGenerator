/**
 * Central grid layout state with undo/redo.
 * Tracks layout (breakpoints, grid, children) and history stack.
 */

import { useCallback, useMemo, useState } from 'react';
import type {
  LayoutState,
  GridCell,
  GridChild,
  BreakpointId,
} from '../types';
import { defaultLayoutState } from '../types';
import { expandToBoundingBox, cellKey } from '../utils/selection';

const MAX_HISTORY = 50;

function deepCloneState(state: LayoutState): LayoutState {
  return JSON.parse(JSON.stringify(state));
}

function nextChildName(children: GridChild[]): string {
  const used = new Set(children.map((c) => c.name));
  let n = 1;
  while (used.has(`child${n}`)) n++;
  return `child${n}`;
}

function generateId(): string {
  return `id_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

export function useGridState(initialState?: LayoutState) {
  const [state, setState] = useState<LayoutState>(
    () => initialState ?? defaultLayoutState()
  );
  const [history, setHistory] = useState<LayoutState[]>([]);
  const [historyForward, setHistoryForward] = useState<LayoutState[]>([]);
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);
  const [pendingSelection, setPendingSelection] = useState<GridCell[]>([]);
  const [isSelecting, setIsSelecting] = useState(false);
  const [useNamedAreas, setUseNamedAreas] = useState(false);

  const pushHistory = useCallback((newState: LayoutState) => {
    setHistory((h) => {
      const next = [...h, deepCloneState(newState)].slice(-MAX_HISTORY);
      return next;
    });
    setHistoryForward([]);
  }, []);

  const currentConfig = useMemo(
    () => state.breakpoints[state.activeBreakpoint],
    [state.breakpoints, state.activeBreakpoint]
  );

  const setActiveBreakpoint = useCallback(
    (bp: BreakpointId) => {
      setState((s) => ({ ...s, activeBreakpoint: bp }));
      setSelectedChildId(null);
      setPendingSelection([]);
    },
    []
  );

  const setGridDefinition = useCallback(
    (updater: (g: typeof currentConfig.grid) => typeof currentConfig.grid) => {
      setState((s) => {
        const bp = s.activeBreakpoint;
        const config = s.breakpoints[bp];
        const nextGrid = updater(config.grid);
        const nextConfig = { ...config, grid: nextGrid };
        return {
          ...s,
          breakpoints: { ...s.breakpoints, [bp]: nextConfig },
        };
      });
    },
    []
  );

  const setRows = useCallback(
    (delta: number) => {
      setState((s) => {
        pushHistory(s);
        const bp = s.activeBreakpoint;
        const config = s.breakpoints[bp];
        const grid = config.grid;
        const newCount = Math.max(1, Math.min(20, grid.rowCount + delta));
        const rowSizes =
          newCount > grid.rowCount
            ? [
                ...grid.rowSizes,
                ...Array(newCount - grid.rowCount)
                  .fill(null)
                  .map(() => ({ type: 'fr' as const, value: 1 })),
              ]
            : grid.rowSizes.slice(0, newCount);
        return {
          ...s,
          breakpoints: {
            ...s.breakpoints,
            [bp]: {
              ...config,
              grid: {
                ...grid,
                rowCount: newCount,
                rowSizes,
              },
            },
          },
        };
      });
      setHistoryForward([]);
    },
    [pushHistory]
  );

  const setColumns = useCallback(
    (delta: number) => {
      setState((s) => {
        pushHistory(s);
        const bp = s.activeBreakpoint;
        const config = s.breakpoints[bp];
        const grid = config.grid;
        const newCount = Math.max(1, Math.min(20, grid.columnCount + delta));
        const columnSizes =
          newCount > grid.columnCount
            ? [
                ...grid.columnSizes,
                ...Array(newCount - grid.columnCount)
                  .fill(null)
                  .map(() => ({ type: 'fr' as const, value: 1 })),
              ]
            : grid.columnSizes.slice(0, newCount);
        return {
          ...s,
          breakpoints: {
            ...s.breakpoints,
            [bp]: {
              ...config,
              grid: {
                ...grid,
                columnCount: newCount,
                columnSizes,
              },
            },
          },
        };
      });
      setHistoryForward([]);
    },
    [pushHistory]
  );

  const startSelection = useCallback((cell: GridCell) => {
    setIsSelecting(true);
    setPendingSelection([cell]);
  }, []);

  const addToSelection = useCallback((cell: GridCell) => {
    setPendingSelection((prev) => {
      const key = cellKey(cell);
      if (prev.some((c) => cellKey(c) === key)) return prev;
      return [...prev, cell];
    });
  }, []);

  const endSelection = useCallback(() => {
    setIsSelecting(false);
    setPendingSelection((prev) => {
      if (prev.length === 0) return [];
      const expanded = expandToBoundingBox(prev);
      setState((s) => {
        pushHistory(s);
        const bp = s.activeBreakpoint;
        const config = s.breakpoints[bp];
        const lockedCells = new Set<string>();
        config.children.forEach((ch) => {
          if (ch.locked) ch.cells.forEach((c) => lockedCells.add(cellKey(c)));
        });
        const overlap = expanded.some((c) => lockedCells.has(cellKey(c)));
        if (overlap) return s;
        const name = nextChildName(config.children);
        const child: GridChild = {
          id: generateId(),
          name,
          cells: expanded,
          locked: false,
          areaName: useNamedAreas ? name : undefined,
        };
        return {
          ...s,
          breakpoints: {
            ...s.breakpoints,
            [bp]: {
              ...config,
              children: [...config.children, child],
            },
          },
        };
      });
      setHistoryForward([]);
      return [];
    });
  }, [pushHistory, useNamedAreas]);

  const clearSelection = useCallback(() => {
    setIsSelecting(false);
    setPendingSelection([]);
  }, []);

  const deleteChild = useCallback(
    (id: string) => {
      setState((s) => {
        pushHistory(s);
        const bp = s.activeBreakpoint;
        const config = s.breakpoints[bp];
        const children = config.children.filter((c) => c.id !== id);
        return {
          ...s,
          breakpoints: {
            ...s.breakpoints,
            [bp]: { ...config, children },
          },
        };
      });
      setHistoryForward([]);
      if (selectedChildId === id) setSelectedChildId(null);
    },
    [pushHistory, selectedChildId]
  );

  const updateChild = useCallback(
    (id: string, updater: (c: GridChild) => GridChild) => {
      setState((s) => {
        const bp = s.activeBreakpoint;
        const config = s.breakpoints[bp];
        const children = config.children.map((c) =>
          c.id === id ? updater(c) : c
        );
        return {
          ...s,
          breakpoints: {
            ...s.breakpoints,
            [bp]: { ...config, children },
          },
        };
      });
    },
    []
  );

  const setChildLock = useCallback(
    (id: string, locked: boolean) => {
      updateChild(id, (c) => ({ ...c, locked }));
    },
    [updateChild]
  );

  const setChildName = useCallback(
    (id: string, name: string) => {
      updateChild(id, (c) => ({
        ...c,
        name: name.trim() || c.name,
        areaName: useNamedAreas ? (name.trim() || c.name) : undefined,
      }));
    },
    [updateChild, useNamedAreas]
  );

  const undo = useCallback(() => {
    if (history.length === 0) return;
    const prev = history[history.length - 1];
    setHistory((h) => h.slice(0, -1));
    setHistoryForward((f) => [deepCloneState(state), ...f]);
    setState(deepCloneState(prev));
    setSelectedChildId(null);
  }, [history, state]);

  const redo = useCallback(() => {
    if (historyForward.length === 0) return;
    const next = historyForward[0];
    setHistoryForward((f) => f.slice(1));
    setHistory((h) => [...h, deepCloneState(state)]);
    setState(deepCloneState(next));
  }, [historyForward, state]);

  const canUndo = history.length > 0;
  const canRedo = historyForward.length > 0;

  const exportLayout = useCallback((): string => {
    const data: import('../types').LayoutExport = {
      version: 1,
      layout: deepCloneState(state),
      exportedAt: new Date().toISOString(),
    };
    return JSON.stringify(data, null, 2);
  }, [state]);

  const importLayout = useCallback((json: string) => {
    try {
      const data = JSON.parse(json) as import('../types').LayoutExport;
      if (data.version !== 1 || !data.layout?.breakpoints) return false;
      const bp = data.layout.activeBreakpoint;
      if (!['desktop', 'tablet', 'mobile'].includes(bp)) return false;
      setState(deepCloneState(data.layout));
      setHistory([]);
      setHistoryForward([]);
      setSelectedChildId(null);
      return true;
    } catch {
      return false;
    }
  }, []);

  return {
    state,
    currentConfig,
    selectedChildId,
    setSelectedChildId,
    pendingSelection,
    isSelecting,
    startSelection,
    addToSelection,
    endSelection,
    clearSelection,
    setActiveBreakpoint,
    setGridDefinition,
    setRows,
    setColumns,
    deleteChild,
    updateChild,
    setChildLock,
    setChildName,
    undo,
    redo,
    canUndo,
    canRedo,
    exportLayout,
    importLayout,
    useNamedAreas,
    setUseNamedAreas,
  };
}
