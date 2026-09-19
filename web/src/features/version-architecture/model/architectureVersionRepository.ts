import {
  normalizeArchitectureSnapshot,
  parseArchitectureVersions,
  type ArchitectureVersion,
} from '../../../entities/architecture';
import { ARCHITECTURE_VERSIONS_STORAGE_KEY } from '../../../shared/config';
import type { KeyValueStorage } from '../../../shared/lib';
import type { ArchitectureVersionRepository } from './architectureVersionRepository.types';

export type { ArchitectureVersionRepository } from './architectureVersionRepository.types';

function normalizeVersion(version: ArchitectureVersion): ArchitectureVersion {
  return {
    ...normalizeArchitectureSnapshot(version),
    id: version.id,
    name: version.name,
    createdAt: version.createdAt,
  };
}

export function createLocalStorageArchitectureVersionRepository(
  storage: KeyValueStorage,
): ArchitectureVersionRepository {
  return {
    load() {
      try {
        const serialized = storage.getItem(ARCHITECTURE_VERSIONS_STORAGE_KEY);
        const versions = parseArchitectureVersions(serialized);
        const normalized = JSON.stringify(versions);

        if (versions.length > 0 && serialized !== normalized) {
          storage.setItem(ARCHITECTURE_VERSIONS_STORAGE_KEY, normalized);
        }

        return versions;
      } catch {
        return [];
      }
    },
    save(versions) {
      try {
        storage.setItem(
          ARCHITECTURE_VERSIONS_STORAGE_KEY,
          JSON.stringify(versions.map(normalizeVersion)),
        );
        return true;
      } catch {
        return false;
      }
    },
  };
}
