import type { ArchitectureSnapshot } from '@/entities/architecture';

export interface ArchitectureAutosaveRepository {
  load(): ArchitectureSnapshot | null;
  save(snapshot: ArchitectureSnapshot): boolean;
}
