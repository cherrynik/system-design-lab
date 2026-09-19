import { Group } from '@mantine/core';
import { useUncontrolled } from '@mantine/hooks';
import { ToggleGroupContext } from './toggle-group.context';
import type { ToggleGroupProps, ToggleGroupValue } from './toggle-group.types';

export function ToggleGroup({
  value,
  defaultValue,
  onValueChange,
  type = 'single',
  children,
  ...props
}: ToggleGroupProps) {
  const fallbackValue: ToggleGroupValue = type === 'multiple' ? [] : '';
  const [selected, setSelected] = useUncontrolled<ToggleGroupValue>({
    value,
    defaultValue,
    finalValue: fallbackValue,
    onChange: onValueChange,
  });

  const isSelected = (item: string) => {
    if (Array.isArray(selected)) return selected.includes(item);
    return selected === item;
  };

  const toggle = (item: string) => {
    if (type === 'single') {
      setSelected(selected === item ? '' : item);
      return;
    }

    const values = Array.isArray(selected) ? selected : [];
    if (values.includes(item)) {
      setSelected(values.filter((valueItem) => valueItem !== item));
      return;
    }

    setSelected([...values, item]);
  };

  return (
    <ToggleGroupContext.Provider value={{ value: selected, type, isSelected, toggle }}>
      <Group data-slot="toggle-group" gap={4} wrap="nowrap" {...props}>
        {children}
      </Group>
    </ToggleGroupContext.Provider>
  );
}
