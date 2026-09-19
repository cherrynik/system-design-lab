import { Button as MantineButton } from '@mantine/core';
import { buttonColorMap, buttonSizeMap, buttonVariantMap } from './button.config';
import type { ButtonProps } from './button.types';

export function Button({ size = 'default', variant = 'default', color, ...props }: ButtonProps) {
  const resolvedColor = color ?? buttonColorMap[variant];

  return (
    <MantineButton
      data-slot="button"
      color={resolvedColor}
      size={buttonSizeMap[size]}
      variant={buttonVariantMap[variant]}
      {...props}
    />
  );
}
