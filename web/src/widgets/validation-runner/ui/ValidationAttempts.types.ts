import type { ValidationAttempt } from '@/features/validate-architecture';

export type ValidationAttemptsProps = {
  attempts: readonly ValidationAttempt[];
  selectedAttemptId?: number | null;
  onSelectAttempt: (id: number) => void;
  currentAttemptSelected?: boolean;
  onSelectCurrentAttempt?: () => void;
};
