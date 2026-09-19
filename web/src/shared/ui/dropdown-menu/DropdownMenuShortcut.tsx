import { Text } from '@mantine/core';
import type { DropdownMenuShortcutProps } from './dropdown-menu.types';

export function DropdownMenuShortcut({ style, ...props }: DropdownMenuShortcutProps) {
  return (
    <Text
      component="span"
      data-slot="dropdown-menu-shortcut"
      c="dimmed"
      size="xs"
      style={{
        float: 'right',
        marginLeft: 'var(--space-4)',
        fontFamily: 'var(--font-code)',
        ...style,
      }}
      {...props}
    />
  );
}
