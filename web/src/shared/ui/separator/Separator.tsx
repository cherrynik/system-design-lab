import { Divider } from '@mantine/core';
import type { SeparatorProps } from './separator.types';

export function Separator(props: SeparatorProps) {
  return <Divider data-slot="separator" {...props} />;
}
