import { createContext, useContext } from 'react';
import type { CollapsibleContextValue } from './collapsible.types';

export const CollapsibleContext = createContext<CollapsibleContextValue | null>(null);

export function useCollapsibleContext() {
  const context = useContext(CollapsibleContext);
  if (!context) {
    throw new Error('Collapsible components must be rendered inside Collapsible');
  }

  return context;
}
