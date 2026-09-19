import type { ArchitectureSnapshot } from '@/entities/architecture';

export type ArchitectureHistoryState = {
  present: ArchitectureSnapshot;
  past: ArchitectureSnapshot[];
  future: ArchitectureSnapshot[];
};
