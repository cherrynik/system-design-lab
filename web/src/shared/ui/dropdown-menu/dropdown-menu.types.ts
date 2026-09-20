import type { Menu } from '@mantine/core';
import type {
  MenuCheckboxItemProps,
  MenuDropdownProps,
  MenuItemProps,
  MenuLabelProps,
  MenuProps,
  MenuRadioGroupProps,
  MenuRadioItemProps,
  MenuSubDropdownProps,
  MenuSubItemProps,
  MenuSubProps,
} from '@mantine/core';
import type { ComponentProps, ReactElement, Ref } from 'react';

export type DropdownMenuProps = Omit<MenuProps, 'onChange' | 'opened'> & {
  onOpenChange?: (opened: boolean) => void;
  open?: boolean;
};
export type DropdownMenuTriggerProps = ComponentProps<typeof Menu.Target> & {
  render?: ReactElement;
};
export type DropdownMenuContentProps = MenuDropdownProps & { ref?: Ref<HTMLDivElement> };
export type DropdownMenuItemProps = MenuItemProps &
  Omit<ComponentProps<'button'>, keyof MenuItemProps> & {
    inset?: boolean;
    variant?: 'default' | 'destructive';
  };
export type DropdownMenuCheckboxItemProps = MenuCheckboxItemProps & { inset?: boolean };
export type DropdownMenuRadioItemProps = MenuRadioItemProps & { inset?: boolean };
export type DropdownMenuRadioGroupProps = MenuRadioGroupProps;
export type DropdownMenuLabelProps = MenuLabelProps & { inset?: boolean };
export type DropdownMenuSeparatorProps = ComponentProps<typeof Menu.Divider>;
export type DropdownMenuShortcutProps = ComponentProps<'span'>;
export type DropdownMenuGroupProps = ComponentProps<'div'>;
export type DropdownMenuSubProps = MenuSubProps;
export type DropdownMenuSubTriggerProps = MenuSubItemProps & {
  inset?: boolean;
};
export type DropdownMenuSubContentProps = MenuSubDropdownProps;
