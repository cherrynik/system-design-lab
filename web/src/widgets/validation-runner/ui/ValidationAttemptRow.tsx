import { UnstyledButton } from '@mantine/core';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/shared/ui';
import type { ValidationAttemptRowProps } from './ValidationAttemptRow.types';
import './validation-attempts.css';

const statusLabels = {
  running: 'Running',
  ready: 'Passed',
  warning: 'Warnings',
  error: 'Failed',
};

function getAttemptSource(attempt: ValidationAttemptRowProps['attempt']) {
  if (attempt.view === 'solutions') return attempt.solutionLabel ?? 'Reference solution';
  return 'My Canvas';
}

export function ValidationAttemptRow({ attempt, selected, onSelect }: ValidationAttemptRowProps) {
  const source = getAttemptSource(attempt);
  const timestamp = new Date(attempt.createdAt);
  const timeLabel = timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <UnstyledButton
      className="validation-attempt-row"
      data-selected={selected || undefined}
      aria-current={selected || undefined}
      aria-label={`View Attempt #${attempt.id}`}
      onClick={() => onSelect(attempt.id)}
    >
      <span className="validation-attempt-row__identity">
        <i className={`validation-dot validation-dot--${attempt.status}`} aria-hidden="true" />
        <span>Attempt #{attempt.id}</span>
      </span>
      <span className="validation-attempt-row__source" title={source}>
        {source}
      </span>
      <span
        className={`validation-attempt-row__status validation-attempt-row__status--${attempt.status}`}
      >
        {statusLabels[attempt.status]}
      </span>
      <Tooltip>
        <TooltipTrigger>
          <time className="validation-attempt-row__time" dateTime={attempt.createdAt}>
            {timeLabel}
          </time>
        </TooltipTrigger>
        <TooltipContent>{timestamp.toLocaleString()}</TooltipContent>
      </Tooltip>
    </UnstyledButton>
  );
}
