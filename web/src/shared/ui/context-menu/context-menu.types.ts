import type { Menu } from '@mantine/core';
import type { ComponentProps, ReactElement } from 'react';

export type ContextMenuProps = ComponentProps<typeof Menu>;
export type ContextMenuTriggerProps = Omit<ComponentProps<typeof Menu.ContextMenu>, 'children'> & {
  children?: React.ReactNode;
  render?: ReactElement;
};
