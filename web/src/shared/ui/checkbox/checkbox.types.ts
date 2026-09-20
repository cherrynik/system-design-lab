import type { CheckboxProps as MantineCheckboxProps } from '@mantine/core';
import type { Ref } from 'react';

export type CheckboxProps = MantineCheckboxProps & { ref?: Ref<HTMLInputElement> };
