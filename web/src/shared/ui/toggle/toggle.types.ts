import type { ButtonProps } from '../button';

export type ToggleProps = Omit<ButtonProps, 'onChange' | 'variant'> & {
  defaultPressed?: boolean;
  onPressedChange?: (pressed: boolean) => void;
  pressed?: boolean;
  variant?: 'default' | 'outline';
};

export type ToggleVariantsOptions = {
  className?: string;
  size?: ToggleProps['size'];
  variant?: ToggleProps['variant'];
};
