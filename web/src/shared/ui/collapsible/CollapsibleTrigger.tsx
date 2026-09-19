import { UnstyledButton } from '@mantine/core';
import { useCollapsibleContext } from './collapsible.context';
import type { CollapsibleTriggerProps } from './collapsible.types';

export function CollapsibleTrigger({ onClick, ...props }: CollapsibleTriggerProps) {
  const { opened, toggle } = useCollapsibleContext();

  return (
    <UnstyledButton
      data-slot="collapsible-trigger"
      aria-expanded={opened}
      onClick={(event) => {
        onClick?.(event);
        if (!event.defaultPrevented) toggle();
      }}
      {...props}
    />
  );
}
