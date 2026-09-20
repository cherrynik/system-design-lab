import { createContext } from 'react';
import type { ConnectionNavigation } from './connectionNavigation.types';

export const ConnectionNavigationContext = createContext<ConnectionNavigation>({
  scope: '',
  highlightedNodeIds: new Set(),
  preview: () => undefined,
  clear: () => undefined,
  focus: () => undefined,
});
