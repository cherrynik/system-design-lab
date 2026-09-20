import type { ReactNode } from 'react';

export type ArchitectureConnectionNavigationProviderProps = {
  children: ReactNode;
  scope: string;
  onFocus: (nodeIds: readonly string[]) => void;
};
