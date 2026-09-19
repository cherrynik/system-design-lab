import { createContext, useContext } from 'react';
import type { ArchitectureCanvasActions } from './architectureCanvas.types';

export const ArchitectureCanvasActionsContext = createContext<ArchitectureCanvasActions | null>(
  null,
);

export function useArchitectureCanvasActions() {
  const actions = useContext(ArchitectureCanvasActionsContext);
  if (!actions) throw new Error('Architecture canvas actions are unavailable');
  return actions;
}
