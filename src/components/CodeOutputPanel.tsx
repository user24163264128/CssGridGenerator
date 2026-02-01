/**
 * Code Output Panel: live CSS and HTML with copy and responsive toggle.
 */

import { useState, useCallback } from 'react';
import {
  generateFullCSS,
  generateResponsiveCSS,
  generateHTML,
} from '../utils/codegen';
import type { BreakpointConfig, LayoutState } from '../types';

interface CodeOutputPanelProps {
  currentConfig: BreakpointConfig;
  fullState: LayoutState;
  useNamedAreas: boolean;
}

type Tab = 'css' | 'html';

export function CodeOutputPanel({
  currentConfig,
  fullState,
  useNamedAreas,
}: CodeOutputPanelProps) {
  const [tab, setTab] = useState<Tab>('css');
  const [responsive, setResponsive] = useState(false);
  const [copied, setCopied] = useState(false);

  const cssContent =
    responsive && tab === 'css'
      ? generateResponsiveCSS(fullState, useNamedAreas)
      : tab === 'css'
        ? generateFullCSS(currentConfig, useNamedAreas)
        : '';

  const htmlContent = tab === 'html' ? generateHTML(currentConfig.children) : '';

  const copyContent = tab === 'css' ? cssContent : htmlContent;

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(copyContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // ignore
    }
  }, [copyContent]);

  return (
    <div className="app__code">
      <div className="code-panel">
        <div className="code-panel__tabs">
          <button
            type="button"
            className={`code-panel__tab ${tab === 'css' ? 'active' : ''}`}
            onClick={() => setTab('css')}
          >
            CSS
          </button>
          <button
            type="button"
            className={`code-panel__tab ${tab === 'html' ? 'active' : ''}`}
            onClick={() => setTab('html')}
          >
            HTML
          </button>
          {tab === 'css' && (
            <label style={{ marginLeft: 12, display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-muted)' }}>
              <input
                type="checkbox"
                checked={responsive}
                onChange={(e) => setResponsive(e.target.checked)}
              />
              Responsive (media queries)
            </label>
          )}
        </div>
        <div className="code-panel__content">
          <pre className="code-panel__pre">
            <code>{tab === 'css' ? cssContent : htmlContent}</code>
          </pre>
        </div>
        <div className="code-panel__actions">
          <button
            type="button"
            className="btn btn--sm btn--primary"
            onClick={handleCopy}
          >
            {copied ? 'Copied!' : 'Copy to clipboard'}
          </button>
        </div>
      </div>
    </div>
  );
}
