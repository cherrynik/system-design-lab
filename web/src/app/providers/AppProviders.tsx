import type { PropsWithChildren } from 'react';
import { TooltipProvider } from '@/shared/ui';

export function AppProviders({ children }: PropsWithChildren) {
  return <TooltipProvider delay={280}>{children}</TooltipProvider>;
}
