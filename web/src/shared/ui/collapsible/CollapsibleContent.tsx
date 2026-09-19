import { Collapse } from '@mantine/core';
import { useCollapsibleContext } from './collapsible.context';
import type { CollapsibleContentProps } from './collapsible.types';

export function CollapsibleContent({ children, ...props }: CollapsibleContentProps) {
  const { opened } = useCollapsibleContext();

  return (
    <Collapse data-slot="collapsible-content" expanded={opened} {...props}>
      {children}
    </Collapse>
  );
}
