import { useEffect, useMemo } from 'react';
import type { ArchitectureSnapshot } from '../../../entities/architecture';
import { createLocalStorageArchitectureAutosaveRepository } from './architectureAutosaveRepository';
import type { ArchitectureAutosaveOptions } from './useArchitectureAutosave.types';

export const DEFAULT_ARCHITECTURE_AUTOSAVE_DELAY_MS = 400;

export function useArchitectureAutosave(
  snapshot: ArchitectureSnapshot,
  {
    debounceMs = DEFAULT_ARCHITECTURE_AUTOSAVE_DELAY_MS,
    pageLifecycleTarget = window,
    repository,
  }: ArchitectureAutosaveOptions = {},
) {
  const activeRepository = useMemo(
    () => repository ?? createLocalStorageArchitectureAutosaveRepository(window.localStorage),
    [repository],
  );

  useEffect(() => {
    let timeoutId: number | null = window.setTimeout(
      () => {
        timeoutId = null;
        activeRepository.save(snapshot);
      },
      Math.max(0, debounceMs),
    );
    const flush = () => {
      if (timeoutId === null) return;
      window.clearTimeout(timeoutId);
      timeoutId = null;
      activeRepository.save(snapshot);
    };
    pageLifecycleTarget.addEventListener('pagehide', flush);
    return () => {
      if (timeoutId !== null) window.clearTimeout(timeoutId);
      pageLifecycleTarget.removeEventListener('pagehide', flush);
    };
  }, [activeRepository, debounceMs, pageLifecycleTarget, snapshot]);
}
