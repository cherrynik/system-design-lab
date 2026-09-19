import type { MantineColorScheme } from '@mantine/core';
import type { ReactNode } from 'react';

export type PlatformProviderProps = {
  children: ReactNode;
  colorScheme?: MantineColorScheme;
};
