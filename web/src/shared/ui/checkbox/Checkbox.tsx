import { Checkbox as MantineCheckbox } from '@mantine/core';
import type { CheckboxProps } from './checkbox.types';

export function Checkbox(props: CheckboxProps) {
  return <MantineCheckbox data-slot="checkbox" size="xs" {...props} />;
}
