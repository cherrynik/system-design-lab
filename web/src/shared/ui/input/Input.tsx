import { Input as MantineInput } from '@mantine/core';
import type { InputProps } from './input.types';

export function Input(props: InputProps) {
  return <MantineInput data-slot="input" size="sm" radius="sm" {...props} />;
}
