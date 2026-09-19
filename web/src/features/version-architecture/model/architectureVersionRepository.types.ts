import type { ArchitectureVersion } from '@/entities/architecture';

export interface ArchitectureVersionRepository {
  load(): ArchitectureVersion[];
  save(versions: ArchitectureVersion[]): boolean;
}
