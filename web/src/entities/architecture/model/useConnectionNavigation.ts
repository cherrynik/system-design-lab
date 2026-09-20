import { useContext } from 'react';
import { ConnectionNavigationContext } from './ConnectionNavigationContext';

export function useConnectionNavigation() {
  return useContext(ConnectionNavigationContext);
}
