import { useUncontrolled } from '@mantine/hooks';
import { Button } from '../button';
import type { ButtonVariant } from '../button';
import type { ToggleProps } from './toggle.types';

export function Toggle({
  pressed,
  defaultPressed = false,
  onPressedChange,
  onClick,
  variant = 'default',
  ...props
}: ToggleProps) {
  const [active, setActive] = useUncontrolled({
    value: pressed,
    defaultValue: defaultPressed,
    finalValue: false,
    onChange: onPressedChange,
  });
  const inactiveVariant: ButtonVariant = variant === 'outline' ? 'outline' : 'ghost';
  const resolvedVariant: ButtonVariant = active ? 'secondary' : inactiveVariant;

  return (
    <Button
      data-slot="toggle"
      aria-pressed={active}
      variant={resolvedVariant}
      onClick={(event) => {
        onClick?.(event);
        if (!event.defaultPrevented) setActive(!active);
      }}
      {...props}
    />
  );
}
