/**
 * Main application: three-panel layout with toolbar, keyboard shortcuts,
 * and grid state (undo/redo, export/import).
 */

import { useEffect, useRef, useCallback } from 'react';
import { useGridState } from './hooks/useGridState';
import { GridCanvas } from './components/GridCanvas';
import { InspectorPanel } from './components/InspectorPanel';
import { CodeOutputPanel } from './components/CodeOutputPanel';
import './styles/reset.css';
import './styles/app.css';

export default function App() {
  const {
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
    undo,
    redo,
    canUndo,
    canRedo,
    exportLayout,
    importLayout,
    useNamedAreas,
    setUseNamedAreas,
  } = useGridState();

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        clearSelection();
        setSelectedChildId(null);
        return;
      }
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedChildId && document.activeElement?.tagName !== 'INPUT') {
          e.preventDefault();
          deleteChild(selectedChildId);
        }
        return;
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
      }
    },
    [
      clearSelection,
      setSelectedChildId,
      selectedChildId,
      deleteChild,
      undo,
      redo,
    ]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const handleExport = useCallback(() => {
    const blob = new Blob([exportLayout()], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'grid-layout.json';
    a.click();
    URL.revokeObjectURL(url);
  }, [exportLayout]);

  const handleImport = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        const text = reader.result as string;
        if (importLayout(text)) {
          // success
        }
      };
      reader.readAsText(file);
      e.target.value = '';
    },
    [importLayout]
  );

  return (
    <div className="app">
      <input
        ref={fileInputRef}
        type="file"
        accept=".json,application/json"
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />

      <header className="app__header">
        <h1 className="app__title">CSS Grid Layout Designer</h1>
        <div className="app__toolbar">
          <button
            type="button"
            className="btn btn--sm"
            onClick={undo}
            disabled={!canUndo}
            title="Undo (Ctrl+Z)"
          >
            Undo
          </button>
          <button
            type="button"
            className="btn btn--sm"
            onClick={redo}
            disabled={!canRedo}
            title="Redo (Ctrl+Shift+Z)"
          >
            Redo
          </button>
          <button
            type="button"
            className="btn btn--sm"
            onClick={handleExport}
            title="Export layout JSON"
          >
            Export JSON
          </button>
          <button
            type="button"
            className="btn btn--sm"
            onClick={handleImport}
            title="Import layout JSON"
          >
            Import JSON
          </button>
        </div>
      </header>

      <div className="app__canvas">
        <GridCanvas
            rowCount={currentConfig.grid.rowCount}
            columnCount={currentConfig.grid.columnCount}
            children={currentConfig.children}
            selectedChildId={selectedChildId}
            pendingSelection={pendingSelection}
            isSelecting={isSelecting}
            onStartSelection={startSelection}
            onAddToSelection={addToSelection}
            onEndSelection={endSelection}
          />
      </div>

      <aside className="app__inspector">
        <InspectorPanel
            grid={currentConfig.grid}
            children={currentConfig.children}
            selectedChildId={selectedChildId}
            activeBreakpoint={state.activeBreakpoint}
            useNamedAreas={useNamedAreas}
            onRowsChange={setRows}
            onColumnsChange={setColumns}
            onGridChange={setGridDefinition}
            onSelectChild={setSelectedChildId}
            onDeleteChild={deleteChild}
            onUpdateChild={updateChild}
            onBreakpointChange={setActiveBreakpoint}
            onToggleNamedAreas={setUseNamedAreas}
          />
      </aside>

      <section className="app__code">
        <CodeOutputPanel
            currentConfig={currentConfig}
            fullState={state}
            useNamedAreas={useNamedAreas}
          />
      </section>
    </div>
  );
}
