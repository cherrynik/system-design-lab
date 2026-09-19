import type { ArchitectureSnapshot, ArchitectureVersion } from '@/entities/architecture';
import type { ArchitectureVersionRepository } from './architectureVersionRepository.types';

export type ArchitectureVersionsOptions = {
  idFactory?: () => string;
  now?: () => Date;
  repository?: ArchitectureVersionRepository;
};

export type UseArchitectureVersionsResult = {
  versions: ArchitectureVersion[];
  latestVersion: ArchitectureVersion | undefined;
  commit: (snapshot: ArchitectureSnapshot) => ArchitectureVersion;
  rename: (versionId: string, name: string) => boolean;
  deleteLatest: () => ArchitectureVersion | null;
  restore: (versionId: string) => ArchitectureSnapshot | null;
};
