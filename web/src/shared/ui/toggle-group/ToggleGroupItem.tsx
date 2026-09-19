import { Toggle } from '../toggle';
import { useToggleGroupContext } from './toggle-group.context';
import type { ToggleGroupItemProps } from './toggle-group.types';

export function ToggleGroupItem({ value, onClick, ...props }: ToggleGroupItemProps) {
  const group = useToggleGroupContext();

  return (
    <Toggle
      data-slot="toggle-group-item"
      pressed={group.isSelected(value)}
      onClick={(event) => {
        onClick?.(event);
        if (!event.defaultPrevented) group.toggle(value);
      }}
      {...props}
    />
  );
}
