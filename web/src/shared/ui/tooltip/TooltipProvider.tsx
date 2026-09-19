import { TooltipDelayContext } from './tooltip.context';
import type { TooltipProviderProps } from './tooltip.types';

export function TooltipProvider({ delay = 0, children }: TooltipProviderProps) {
  return <TooltipDelayContext.Provider value={delay}>{children}</TooltipDelayContext.Provider>;
}
