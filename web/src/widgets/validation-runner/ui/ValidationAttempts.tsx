import { ScrollArea } from '@/shared/ui';
import { ValidationAttemptRow } from './ValidationAttemptRow';
import { ValidationCurrentAttemptRow } from './ValidationCurrentAttemptRow';
import type { ValidationAttemptsProps } from './ValidationAttempts.types';
import './validation-attempts.css';

export function ValidationAttempts({
  attempts,
  selectedAttemptId,
  onSelectAttempt,
  currentAttemptSelected = false,
  onSelectCurrentAttempt,
}: ValidationAttemptsProps) {
  return (
    <section className="validation-attempts" aria-label="Validation attempts">
      <div className="validation-current-attempt">
        <ValidationCurrentAttemptRow
          selected={currentAttemptSelected}
          onSelect={onSelectCurrentAttempt}
        />
      </div>
      <ScrollArea className="validation-attempts-history" type="auto">
        <ul className="validation-attempts-list" aria-label="Saved attempts">
          {attempts.map((attempt) => (
            <li key={attempt.id}>
              <ValidationAttemptRow
                attempt={attempt}
                selected={!currentAttemptSelected && attempt.id === selectedAttemptId}
                onSelect={onSelectAttempt}
              />
            </li>
          ))}
        </ul>
        {attempts.length === 0 && (
          <div className="validation-attempts-empty">
            <p>No saved attempts yet.</p>
            <p>Validate a topology to keep its canvas and results here.</p>
          </div>
        )}
      </ScrollArea>
    </section>
  );
}
