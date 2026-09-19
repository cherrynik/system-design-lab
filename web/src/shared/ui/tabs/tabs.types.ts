import type { Tabs as MantineTabs, TabsProps as MantineTabsProps } from '@mantine/core';
import type { ComponentProps } from 'react';

export type TabsProps = Omit<MantineTabsProps, 'onChange'> & {
  onValueChange?: (value: string) => void;
};

export type TabsListProps = ComponentProps<typeof MantineTabs.List> & {
  variant?: 'default' | 'line';
};

export type TabsListVariantsOptions = {
  className?: string;
  variant?: TabsListProps['variant'];
};

export type TabsTriggerProps = ComponentProps<typeof MantineTabs.Tab>;
export type TabsContentProps = ComponentProps<typeof MantineTabs.Panel>;
