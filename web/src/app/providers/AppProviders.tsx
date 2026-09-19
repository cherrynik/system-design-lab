import type { PropsWithChildren } from 'react';
import { PlatformProvider } from '@/shared/config';

export function AppProviders({ children }: PropsWithChildren) {
  return <PlatformProvider>{children}</PlatformProvider>;
}
