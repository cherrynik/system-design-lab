import { Tabs as MantineTabs } from '@mantine/core';
import type { TabsProps } from './tabs.types';

export function Tabs({ onValueChange, ...props }: TabsProps) {
  const onChange = (value: string | null) => {
    if (value) onValueChange?.(value);
  };

  return (
    <MantineTabs data-slot="tabs" activateTabWithKeyboard={false} onChange={onChange} {...props} />
  );
}
