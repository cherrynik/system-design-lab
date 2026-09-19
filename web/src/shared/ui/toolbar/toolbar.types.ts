import type { DividerProps, GroupProps } from '@mantine/core';
import type { ButtonProps, IconButtonProps } from '../button';

export type ToolbarProps = GroupProps & {
  orientation?: 'horizontal' | 'vertical';
};
export type ToolbarGroupProps = GroupProps;
export type ToolbarButtonProps = ButtonProps;
export type ToolbarIconButtonProps = IconButtonProps;
export type ToolbarSeparatorProps = DividerProps;
