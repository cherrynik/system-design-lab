import type { TabsListVariantsOptions } from './tabs.types';

export function tabsListVariants(options?: TabsListVariantsOptions) {
  return options?.className ?? '';
}
