import { ActionIcon } from '@mantine/core';
import { buttonColorMap, buttonVariantMap, iconButtonSizeMap } from './button.config';
import type { IconButtonProps } from './button.types';

export function IconButton({
  label,
  title = label,
  size = 'icon',
  variant = 'ghost',
  color,
  ...props
}: IconButtonProps) {
  const resolvedColor = color ?? buttonColorMap[variant];

  return (
    <ActionIcon
      aria-label={label}
      data-slot="icon-button"
      title={title}
      color={resolvedColor}
      size={iconButtonSizeMap[size]}
      variant={buttonVariantMap[variant]}
      {...props}
    />
  );
}
