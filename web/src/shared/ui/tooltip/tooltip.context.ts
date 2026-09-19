import { createContext, useContext } from 'react';

export const TooltipDelayContext = createContext(0);

export function useTooltipDelay() {
  return useContext(TooltipDelayContext);
}
