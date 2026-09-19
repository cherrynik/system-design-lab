import { Text } from '@mantine/core';
import type { DialogDescriptionProps } from './dialog.types';

export function DialogDescription(props: DialogDescriptionProps) {
  return <Text component="p" data-slot="dialog-description" c="dimmed" size="sm" {...props} />;
}
