/**
 * Inspector Panel: grid controls, child list, breakpoints, gaps, alignment.
 */

import type {
  GridDefinition,
  GridChild,
  BreakpointId,
  PlaceItems,
} from '../types';

interface InspectorPanelProps {
  grid: GridDefinition;
  children: GridChild[];
  selectedChildId: string | null;
  activeBreakpoint: BreakpointId;
  useNamedAreas: boolean;
  onRowsChange: (delta: number) => void;
  onColumnsChange: (delta: number) => void;
  onGridChange: (updater: (g: GridDefinition) => GridDefinition) => void;
  onSelectChild: (id: string | null) => void;
  onDeleteChild: (id: string) => void;
  onUpdateChild: (id: string, updater: (c: GridChild) => GridChild) => void;
  onBreakpointChange: (bp: BreakpointId) => void;
  onToggleNamedAreas: (value: boolean) => void;
}

const BREAKPOINTS: { id: BreakpointId; label: string }[] = [
  { id: 'desktop', label: 'Desktop' },
  { id: 'tablet', label: 'Tablet' },
  { id: 'mobile', label: 'Mobile' },
];

const PLACE_ITEMS_OPTIONS: { value: PlaceItems; label: string }[] = [
  { value: 'stretch', label: 'stretch' },
  { value: 'start', label: 'start' },
  { value: 'end', label: 'end' },
  { value: 'center', label: 'center' },
  { value: 'normal', label: 'normal' },
];

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

export function InspectorPanel({
  grid,
  children,
  selectedChildId,
  activeBreakpoint,
  useNamedAreas,
  onRowsChange,
  onColumnsChange,
  onGridChange,
  onSelectChild,
  onDeleteChild,
  onUpdateChild,
  onBreakpointChange,
  onToggleNamedAreas,
}: InspectorPanelProps) {
  const selectedChild = children.find((c) => c.id === selectedChildId);

  return (
    <div className="app__inspector">
      {/* Breakpoints */}
      <div className="inspector-section">
        <div className="inspector-section__title">Breakpoint</div>
        <div className="inspector-actions">
          {BREAKPOINTS.map((bp) => (
            <button
              key={bp.id}
              type="button"
              className={`btn btn--sm ${activeBreakpoint === bp.id ? 'btn--primary' : ''}`}
              onClick={() => onBreakpointChange(bp.id)}
            >
              {bp.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid structure */}
      <div className="inspector-section">
        <div className="inspector-section__title">Grid</div>
        <div className="inspector-actions">
          <label>
            Rows
            <button
              type="button"
              className="btn btn--sm"
              onClick={() => onRowsChange(-1)}
              aria-label="Decrease rows"
            >
              −
            </button>
            <span style={{ minWidth: 24, textAlign: 'center' }}>
              {grid.rowCount}
            </span>
            <button
              type="button"
              className="btn btn--sm"
              onClick={() => onRowsChange(1)}
              aria-label="Increase rows"
            >
              +
            </button>
          </label>
          <label>
            Cols
            <button
              type="button"
              className="btn btn--sm"
              onClick={() => onColumnsChange(-1)}
              aria-label="Decrease columns"
            >
              −
            </button>
            <span style={{ minWidth: 24, textAlign: 'center' }}>
              {grid.columnCount}
            </span>
            <button
              type="button"
              className="btn btn--sm"
              onClick={() => onColumnsChange(1)}
              aria-label="Increase columns"
            >
              +
            </button>
          </label>
        </div>
      </div>

      {/* Gaps */}
      <div className="inspector-section">
        <div className="inspector-section__title">Gap</div>
        <div className="inspector-actions">
          <label>
            gap
            <input
              type="number"
              min={0}
              value={grid.gap}
              onChange={(e) =>
                onGridChange((g) => ({
                  ...g,
                  gap: Math.max(0, Number(e.target.value) || 0),
                }))
              }
            />
          </label>
          <label>
            row-gap
            <input
              type="number"
              min={0}
              value={grid.rowGap}
              onChange={(e) =>
                onGridChange((g) => ({
                  ...g,
                  rowGap: Math.max(0, Number(e.target.value) || 0),
                }))
              }
            />
          </label>
          <label>
            column-gap
            <input
              type="number"
              min={0}
              value={grid.columnGap}
              onChange={(e) =>
                onGridChange((g) => ({
                  ...g,
                  columnGap: Math.max(0, Number(e.target.value) || 0),
                }))
              }
            />
          </label>
        </div>
      </div>

      {/* Place items */}
      <div className="inspector-section">
        <div className="inspector-section__title">Place items</div>
        <div className="inspector-actions">
          <select
            value={grid.placeItems}
            onChange={(e) =>
              onGridChange((g) => ({
                ...g,
                placeItems: e.target.value as PlaceItems,
              }))
            }
          >
            {PLACE_ITEMS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Named areas mode */}
      <div className="inspector-section">
        <div className="inspector-section__title">Output</div>
        <div className="inspector-actions">
          <label style={{ cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={useNamedAreas}
              onChange={(e) => onToggleNamedAreas(e.target.checked)}
            />
            grid-template-areas
          </label>
        </div>
      </div>

      {/* Children list */}
      <div className="inspector-section">
        <div className="inspector-section__title">Children</div>
        <div className="child-list">
          {children.length === 0 ? (
            <div className="child-list__empty">
              Drag on grid to create a child region
            </div>
          ) : (
            children.map((child, i) => (
              <div
                key={child.id}
                className={`child-list__item ${selectedChildId === child.id ? 'selected' : ''}`}
                onClick={() => onSelectChild(child.id)}
              >
                <div
                  className="child-list__swatch"
                  style={{ backgroundColor: getChildColor(i) }}
                />
                <div className="child-list__name">
                  <input
                    type="text"
                    value={child.name}
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) =>
                      onUpdateChild(child.id, (c) => ({
                        ...c,
                        name: e.target.value,
                        areaName: useNamedAreas ? e.target.value : undefined,
                      }))
                    }
                    onBlur={(e) =>
                      onUpdateChild(child.id, (c) => ({
                        ...c,
                        name: e.target.value.trim() || c.name,
                        areaName: useNamedAreas
                          ? (e.target.value.trim() || c.name)
                          : undefined,
                      }))
                    }
                  />
                </div>
                <div className="child-list__actions">
                  <button
                    type="button"
                    className="child-list__btn"
                    title={child.locked ? 'Unlock' : 'Lock'}
                    data-locked={child.locked}
                    onClick={(e) => {
                      e.stopPropagation();
                      onUpdateChild(child.id, (c) => ({ ...c, locked: !c.locked }));
                    }}
                  >
                    {child.locked ? '🔒' : '🔓'}
                  </button>
                  <button
                    type="button"
                    className="child-list__btn"
                    title="Delete"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteChild(child.id);
                    }}
                  >
                    🗑
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Selected child: justify-self / align-self */}
      {selectedChild && (
        <div className="inspector-section">
          <div className="inspector-section__title">Selected: {selectedChild.name}</div>
          <div className="inspector-actions">
            <label>
              justify-self
              <select
                value={selectedChild.justifySelf ?? ''}
                onChange={(e) =>
                  onUpdateChild(selectedChild.id, (c) => ({
                    ...c,
                    justifySelf: (e.target.value || undefined) as
                      | 'start'
                      | 'end'
                      | 'center'
                      | 'stretch'
                      | undefined,
                  }))
                }
              >
                <option value="">—</option>
                <option value="start">start</option>
                <option value="end">end</option>
                <option value="center">center</option>
                <option value="stretch">stretch</option>
              </select>
            </label>
            <label>
              align-self
              <select
                value={selectedChild.alignSelf ?? ''}
                onChange={(e) =>
                  onUpdateChild(selectedChild.id, (c) => ({
                    ...c,
                    alignSelf: (e.target.value || undefined) as
                      | 'start'
                      | 'end'
                      | 'center'
                      | 'stretch'
                      | undefined,
                  }))
                }
              >
                <option value="">—</option>
                <option value="start">start</option>
                <option value="end">end</option>
                <option value="center">center</option>
                <option value="stretch">stretch</option>
              </select>
            </label>
          </div>
        </div>
      )}
    </div>
  );
}
