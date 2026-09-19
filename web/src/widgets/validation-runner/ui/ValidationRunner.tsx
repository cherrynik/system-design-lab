import type { RefObject } from 'react';
import { Play, Trash2 } from 'lucide-react';
import { TerminalLineText, type ValidationTerminalLine } from '@/features/validate-architecture';
import { Button, IconButton, Kbd, KbdGroup } from '@/shared/ui';

export type { ValidationTerminalLine } from '@/features/validate-architecture';

type ValidationRunnerProps = {
  error: string | null;
  lines: ValidationTerminalLine[];
  running: boolean;
  status: 'idle' | 'running' | 'ready' | 'warning' | 'error';
  usesCommandKey: boolean;
  outputRef: RefObject<HTMLDivElement | null>;
  onClear: () => void;
  onValidate: () => void;
};

export function ValidationRunner({
  error,
  lines,
  running,
  status,
  usesCommandKey,
  outputRef,
  onClear,
  onValidate,
}: ValidationRunnerProps) {
  return (
    <section className="panel validation-panel validation-terminal">
      <div className="validation-header">
        <div className="validation-title" aria-live="polite">
          <span className="panel-id">TEST RUNNER</span>
          <i className={`validation-dot validation-dot--${status}`} aria-hidden="true" />
          <span className="sr-only">{status}</span>
        </div>
        <div className="validation-actions">
          <IconButton
            label="Clear test runner"
            className="clear-terminal-button"
            variant="destructive"
            size="icon-sm"
            onClick={onClear}
            disabled={running || !lines.length}
          >
            <Trash2 />
          </IconButton>
          <Button className="validate-button" onClick={onValidate} disabled={running}>
            <span>
              {!running && <Play aria-hidden="true" />}
              {running ? 'Running…' : 'Validate'}
            </span>
            <KbdGroup className="validate-shortcut">
              <Kbd>{usesCommandKey ? '⌘' : 'Ctrl'}</Kbd>
              <Kbd>↵</Kbd>
            </KbdGroup>
          </Button>
        </div>
      </div>
      <div className="validation-body">
        {error && <div className="error-card">{error}</div>}
        <div
          ref={outputRef}
          className={`terminal-output ${!lines.length ? 'terminal-output--idle' : ''}`}
        >
          {!lines.length && (
            <>
              <p className="terminal-line terminal-line--info">
                archlab simulator v0.3 · topology loaded
              </p>
              <p className="terminal-cursor">▋</p>
            </>
          )}
          {lines.map((line, index) => (
            <p
              key={`${index}-${line.text}`}
              className={`terminal-line terminal-line--${line.kind}`}
            >
              {line.kind === 'pending' && <span className="terminal-spinner" />}
              <TerminalLineText text={line.text} warningCount={line.warningCount} />
            </p>
          ))}
        </div>
      </div>
    </section>
  );
}
