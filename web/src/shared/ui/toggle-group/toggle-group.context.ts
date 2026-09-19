import { createContext, useContext } from 'react';
import type { ToggleGroupContextValue } from './toggle-group.types';

export const ToggleGroupContext = createContext<ToggleGroupContextValue | null>(null);

export function useToggleGroupContext() {
  const context = useContext(ToggleGroupContext);
  if (!context) {
    throw new Error('ToggleGroupItem must be rendered inside ToggleGroup');
  }

  return context;
}
