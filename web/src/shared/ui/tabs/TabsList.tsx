import { Tabs as MantineTabs } from '@mantine/core';
import type { TabsListProps } from './tabs.types';

export function TabsList({ variant = 'default', ...props }: TabsListProps) {
  return <MantineTabs.List data-slot="tabs-list" data-variant={variant} {...props} />;
}
