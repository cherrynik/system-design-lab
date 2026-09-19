import type { GroupProps } from '@mantine/core';
import type { ToggleProps } from '../toggle';

export type ToggleGroupType = 'single' | 'multiple';
export type ToggleGroupValue = string | string[];

export type ToggleGroupContextValue = {
  isSelected: (item: string) => boolean;
  toggle: (item: string) => void;
  type: ToggleGroupType;
  value: ToggleGroupValue;
};

export type ToggleGroupProps = Omit<GroupProps, 'defaultValue' | 'onChange'> & {
  defaultValue?: ToggleGroupValue;
  onValueChange?: (value: ToggleGroupValue) => void;
  type?: ToggleGroupType;
  value?: ToggleGroupValue;
  variant?: ToggleProps['variant'];
};

export type ToggleGroupItemProps = Omit<
  ToggleProps,
  'defaultPressed' | 'onPressedChange' | 'pressed'
> & {
  value: string;
};
