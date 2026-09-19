import type { ArchitectureNodeValidationState } from '@/entities/architecture';
import type { CardValidationProps } from './validationProps.types';

export function getCardValidationProps(
  state?: ArchitectureNodeValidationState,
): CardValidationProps {
  return {
    validation: state?.status ?? 'idle',
    validationMessage:
      state?.issues.map(({ message, suggestion }) => `${message}\n${suggestion}`).join('\n\n') ??
      '',
  };
}
