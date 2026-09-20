import { useCallback, useMemo, useState } from 'react';
import { ConnectionNavigationContext } from '../model/ConnectionNavigationContext';
import type { ConnectionNavigationPreview } from '../model/connectionNavigation.types';
import type { ArchitectureConnectionNavigationProviderProps } from './ArchitectureConnectionNavigationProvider.types';

export function ArchitectureConnectionNavigationProvider({
  children,
  scope,
  onFocus,
}: ArchitectureConnectionNavigationProviderProps) {
  const [active, setActive] = useState<ConnectionNavigationPreview | null>(null);
  const [previousScope, setPreviousScope] = useState(scope);
  if (previousScope !== scope) {
    setPreviousScope(scope);
    setActive(null);
  }
  const preview = useCallback((owner: string, nodeIds: readonly string[]) => {
    setActive({ owner, nodeIds });
  }, []);
  const clear = useCallback((owner: string) => {
    setActive((current) => {
      if (current?.owner === owner) return null;
      return current;
    });
  }, []);
  const value = useMemo(
    () => ({ scope, highlightedNodeIds: new Set(active?.nodeIds), preview, clear, focus: onFocus }),
    [scope, active, preview, clear, onFocus],
  );
  return (
    <ConnectionNavigationContext.Provider value={value}>
      {children}
    </ConnectionNavigationContext.Provider>
  );
}
