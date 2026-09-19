import type { InputProps as MantineInputProps } from '@mantine/core';
import type { ComponentPropsWithoutRef, Ref } from 'react';

type NativeInputProps = ComponentPropsWithoutRef<'input'>;

export type InputProps = MantineInputProps &
  Omit<NativeInputProps, keyof MantineInputProps> & {
    ref?: Ref<HTMLInputElement>;
  };
