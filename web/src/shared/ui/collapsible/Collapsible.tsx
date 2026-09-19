import { useUncontrolled } from '@mantine/hooks';
import { CollapsibleContext } from './collapsible.context';
import type { CollapsibleProps } from './collapsible.types';

export function Collapsible({
  open,
  defaultOpen = false,
  onOpenChange,
  children,
  ...props
}: CollapsibleProps) {
  const [opened, setOpened] = useUncontrolled({
    value: open,
    defaultValue: defaultOpen,
    finalValue: false,
    onChange: onOpenChange,
  });

  const toggle = () => setOpened(!opened);

  return (
    <CollapsibleContext.Provider value={{ opened, toggle }}>
      <div data-slot="collapsible" {...props}>
        {children}
      </div>
    </CollapsibleContext.Provider>
  );
}
