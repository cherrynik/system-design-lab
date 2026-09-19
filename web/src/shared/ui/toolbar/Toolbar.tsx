import { Group } from '@mantine/core';
import type { KeyboardEvent } from 'react';
import type { ToolbarProps } from './toolbar.types';

export function Toolbar({ orientation = 'horizontal', onKeyDown, ...props }: ToolbarProps) {
  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    onKeyDown?.(event);
    if (event.defaultPrevented) return;

    const previousKey = orientation === 'horizontal' ? 'ArrowLeft' : 'ArrowUp';
    const nextKey = orientation === 'horizontal' ? 'ArrowRight' : 'ArrowDown';
    if (event.key !== previousKey && event.key !== nextKey) return;

    const buttons = Array.from(
      event.currentTarget.querySelectorAll<HTMLButtonElement>('button:not(:disabled)'),
    );
    const currentIndex = buttons.indexOf(document.activeElement as HTMLButtonElement);
    if (currentIndex < 0 || buttons.length === 0) return;

    event.preventDefault();
    const direction = event.key === nextKey ? 1 : -1;
    const nextIndex = (currentIndex + direction + buttons.length) % buttons.length;
    buttons[nextIndex]?.focus();
  };

  return (
    <Group
      data-slot="toolbar"
      role="toolbar"
      data-orientation={orientation}
      gap={4}
      wrap="nowrap"
      onKeyDown={handleKeyDown}
      {...props}
    />
  );
}
