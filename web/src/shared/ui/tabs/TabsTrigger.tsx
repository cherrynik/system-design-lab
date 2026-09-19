import { Tabs as MantineTabs } from '@mantine/core';
import type { TabsTriggerProps } from './tabs.types';

export function TabsTrigger(props: TabsTriggerProps) {
  return <MantineTabs.Tab data-slot="tabs-trigger" {...props} />;
}
