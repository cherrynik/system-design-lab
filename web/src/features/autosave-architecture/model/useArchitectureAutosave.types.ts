import type { ArchitectureAutosaveRepository } from './architectureAutosaveRepository.types';

export type PageLifecycleTarget = Pick<Window, 'addEventListener' | 'removeEventListener'>;

export type ArchitectureAutosaveOptions = {
  debounceMs?: number;
  pageLifecycleTarget?: PageLifecycleTarget;
  repository?: ArchitectureAutosaveRepository;
};
