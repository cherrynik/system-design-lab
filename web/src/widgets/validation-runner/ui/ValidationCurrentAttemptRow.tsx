import { UnstyledButton } from '@mantine/core';
import type { ValidationCurrentAttemptRowProps } from './ValidationCurrentAttemptRow.types';
import './validation-attempts.css';

export function ValidationCurrentAttemptRow({
  selected,
  onSelect,
}: ValidationCurrentAttemptRowProps) {
  return (
    <UnstyledButton
      className="validation-attempt-row validation-attempt-row--current"
      data-selected={selected || undefined}
      aria-current={selected || undefined}
      aria-label="View Current attempt"
      onClick={onSelect}
    >
      <span className="validation-attempt-row__identity">
        <i className="validation-current-dot" aria-hidden="true" />
        <span>Current attempt</span>
      </span>
      <span className="validation-attempt-row__source">My Canvas</span>
      <span className="validation-attempt-row__status">Editable</span>
    </UnstyledButton>
  );
}
