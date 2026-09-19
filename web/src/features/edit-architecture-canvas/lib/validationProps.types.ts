import type { ArchitectureNodeValidationState } from '@/entities/architecture';

export type CardValidationProps = {
  validation: ArchitectureNodeValidationState['status'] | 'idle';
  validationMessage: string;
};
