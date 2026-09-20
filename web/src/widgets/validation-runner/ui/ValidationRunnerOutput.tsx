import { Alert } from '@mantine/core';
import clsx from 'clsx';
import { AlertTriangle } from 'lucide-react';
import { ScrollArea } from '@/shared/ui';
import type { ValidationRunnerOutputProps } from './ValidationRunner.types';
import { ValidationTerminalRow } from './ValidationTerminalRow';

export function ValidationRunnerOutput({ error, lines, outputRef }: ValidationRunnerOutputProps) {
  const idle = lines.length === 0;
  const outputClassName = clsx('terminal-output', idle && 'terminal-output--idle');

  return (
    <div className="validation-body">
      {error && (
        <Alert icon={<AlertTriangle size={15} />} color="red" variant="light">
          {error}
        </Alert>
      )}

      <ScrollArea
        viewportRef={outputRef}
        classNames={{ viewport: 'terminal-output__viewport' }}
        className={outputClassName}
        type="auto"
      >
        {idle && (
          <div className="terminal-idle-state">
            <p className="terminal-line terminal-line--info">archlab simulator v0.4</p>
            <p className="terminal-line terminal-line--muted">
              Run validation to inspect the active topology.
            </p>
          </div>
        )}

        {lines.map((line, index) => (
          <ValidationTerminalRow key={`${index}-${line.text}`} line={line} index={index} />
        ))}
      </ScrollArea>
    </div>
  );
}
