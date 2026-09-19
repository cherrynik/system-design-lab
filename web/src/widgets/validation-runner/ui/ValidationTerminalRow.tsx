import { TerminalLineText } from '@/features/validate-architecture';
import type { ValidationTerminalRowProps } from './ValidationRunner.types';

export function ValidationTerminalRow({ line, index }: ValidationTerminalRowProps) {
  const pending = line.kind === 'pending';

  return (
    <p className={`terminal-line terminal-line--${line.kind}`} data-line={index}>
      {pending && <span className="terminal-spinner" />}
      <TerminalLineText text={line.text} warningCount={line.warningCount} />
    </p>
  );
}
