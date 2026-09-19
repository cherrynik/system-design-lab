import { Tabs as MantineTabs } from '@mantine/core';
import type { TabsContentProps } from './tabs.types';

export function TabsContent(props: TabsContentProps) {
  return <MantineTabs.Panel data-slot="tabs-content" {...props} />;
}
