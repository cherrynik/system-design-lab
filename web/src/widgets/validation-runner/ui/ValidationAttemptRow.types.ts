import type { ValidationAttempt } from '@/features/validate-architecture';

export type ValidationAttemptRowProps = {
  attempt: ValidationAttempt;
  selected: boolean;
  onSelect: (id: number) => void;
};
