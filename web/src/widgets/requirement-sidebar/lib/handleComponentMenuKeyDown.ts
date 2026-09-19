import type { KeyboardEvent } from 'react';

export function handleComponentMenuKeyDown(
  event: KeyboardEvent<HTMLDivElement>,
  onDismiss: () => void,
) {
  if (event.key === 'Escape') {
    event.preventDefault();
    onDismiss();
    return;
  }

  const items = Array.from(
    event.currentTarget.querySelectorAll<HTMLButtonElement>('[role="menuitem"]:not(:disabled)'),
  );
  if (!items.length) return;

  if (event.key === 'Home') {
    event.preventDefault();
    items[0]?.focus();
    return;
  }

  if (event.key === 'End') {
    event.preventDefault();
    items.at(-1)?.focus();
    return;
  }

  if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;

  event.preventDefault();
  const activeIndex = items.indexOf(document.activeElement as HTMLButtonElement);
  const direction = event.key === 'ArrowDown' ? 1 : -1;
  const nextIndex = (activeIndex + direction + items.length) % items.length;
  items[nextIndex]?.focus();
}
