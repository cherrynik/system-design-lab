import {
  migrateLegacyArchitectureCanvas,
  normalizeArchitectureSnapshot,
  parseArchitectureSnapshot,
  type ArchitectureSnapshot,
} from '../../../entities/architecture';
import {
  ARCHITECTURE_AUTOSAVE_STORAGE_KEY,
  ARCHITECTURE_LEGACY_CANVAS_STORAGE_KEY,
  ARCHITECTURE_STORAGE_MIGRATION_KEY,
} from '../../../shared/config';
import type { KeyValueStorage } from '../../../shared/lib';

export interface ArchitectureAutosaveRepository {
  load(): ArchitectureSnapshot | null;
  save(snapshot: ArchitectureSnapshot): boolean;
}

export function createLocalStorageArchitectureAutosaveRepository(
  storage: KeyValueStorage,
): ArchitectureAutosaveRepository {
  return {
    load() {
      try {
        const serializedSnapshot = storage.getItem(ARCHITECTURE_AUTOSAVE_STORAGE_KEY);
        const currentSnapshot = parseArchitectureSnapshot(serializedSnapshot);
        if (currentSnapshot) {
          if (!storage.getItem(ARCHITECTURE_STORAGE_MIGRATION_KEY)) {
            storage.setItem(ARCHITECTURE_STORAGE_MIGRATION_KEY, '1');
          }
          return currentSnapshot;
        }

        if (!storage.getItem(ARCHITECTURE_STORAGE_MIGRATION_KEY)) {
          const migrated = migrateLegacyArchitectureCanvas(
            storage.getItem(ARCHITECTURE_LEGACY_CANVAS_STORAGE_KEY),
          );
          if (migrated) {
            const normalized = normalizeArchitectureSnapshot(migrated);
            storage.setItem(ARCHITECTURE_AUTOSAVE_STORAGE_KEY, JSON.stringify(normalized));
            storage.setItem(ARCHITECTURE_STORAGE_MIGRATION_KEY, '1');
            return normalized;
          }
          storage.setItem(ARCHITECTURE_STORAGE_MIGRATION_KEY, '1');
        }
        return null;
      } catch {
        return null;
      }
    },
    save(snapshot) {
      try {
        storage.setItem(
          ARCHITECTURE_AUTOSAVE_STORAGE_KEY,
          JSON.stringify(normalizeArchitectureSnapshot(snapshot)),
        );
        return true;
      } catch {
        return false;
      }
    },
  };
}
