import '@mantine/core/styles.css';

import { MantineProvider } from '@mantine/core';
import { TooltipProvider } from '@/shared/ui/tooltip';
import { platformTheme } from './platform-theme';
import type { PlatformProviderProps } from './platform-provider.types';

export function PlatformProvider({ children, colorScheme = 'dark' }: PlatformProviderProps) {
  return (
    <MantineProvider theme={platformTheme} defaultColorScheme={colorScheme}>
      <TooltipProvider delay={250}>{children}</TooltipProvider>
    </MantineProvider>
  );
}
