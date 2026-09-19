import type { ToggleVariantsOptions } from './toggle.types';

export function toggleVariants(options?: ToggleVariantsOptions) {
  return options?.className ?? '';
}
