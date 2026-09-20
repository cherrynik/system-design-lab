import { ScrollArea } from '@/shared/ui';
import { ValidationAttemptRow } from './ValidationAttemptRow';
import type { ValidationAttemptsProps } from './ValidationAttempts.types';
import './validation-attempts.css';

export function ValidationAttempts({
  attempts,
  selectedAttemptId,
  onSelectAttempt,
}: ValidationAttemptsProps) {
  if (attempts.length === 0) {
    return (
      <div className="validation-attempts-empty">
        <p>No attempts yet.</p>
        <p>Validate a topology to keep its canvas and results here.</p>
      </div>
    );
  }

  return (
    <ScrollArea className="validation-attempts" type="auto">
      <ul className="validation-attempts-list" aria-label="Validation attempts">
        {attempts.map((attempt) => (
          <li key={attempt.id}>
            <ValidationAttemptRow
              attempt={attempt}
              selected={attempt.id === selectedAttemptId}
              onSelect={onSelectAttempt}
            />
          </li>
        ))}
      </ul>
    </ScrollArea>
  );
}
