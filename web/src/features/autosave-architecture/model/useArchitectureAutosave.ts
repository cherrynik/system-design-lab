import { useEffect, useMemo } from 'react';
import type { ArchitectureSnapshot } from '../../../entities/architecture';
import {
  createLocalStorageArchitectureAutosaveRepository,
  type ArchitectureAutosaveRepository,
} from './architectureAutosaveRepository';

export const DEFAULT_ARCHITECTURE_AUTOSAVE_DELAY_MS = 400;

type PageLifecycleTarget = Pick<Window, 'addEventListener' | 'removeEventListener'>;

type ArchitectureAutosaveOptions = {
  debounceMs?: number;
  pageLifecycleTarget?: PageLifecycleTarget;
  repository?: ArchitectureAutosaveRepository;
};

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
    let timeoutId: ReturnType<typeof window.setTimeout> | null = window.setTimeout(
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
