import { createContext, useContext } from 'react';
import type { PopoverContextValue } from './popover.types';

export const PopoverContext = createContext<PopoverContextValue | null>(null);

export function usePopoverContext() {
  const context = useContext(PopoverContext);
  if (!context) {
    throw new Error('PopoverContent must be rendered inside Popover');
  }

  return context;
}
