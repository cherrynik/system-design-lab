import { describe, expect, it } from 'vitest';
import type { ArchitectureSnapshot } from '../../../entities/architecture';
import {
  ARCHITECTURE_AUTOSAVE_STORAGE_KEY,
  ARCHITECTURE_LEGACY_CANVAS_STORAGE_KEY,
  ARCHITECTURE_STORAGE_MIGRATION_KEY,
} from '../../../shared/config';
import type { KeyValueStorage } from '../../../shared/lib';
import { createLocalStorageArchitectureAutosaveRepository } from './architectureAutosaveRepository';

class MemoryStorage implements KeyValueStorage {
  private readonly values = new Map<string, string>();

  getItem(key: string) {
    return this.values.get(key) ?? null;
  }

  setItem(key: string, value: string) {
    this.values.set(key, value);
  }
}

const snapshot: ArchitectureSnapshot = {
  nodes: [
    {
      id: 'client',
      type: 'architecture',
      position: { x: 10, y: 20 },
      data: { kind: 'client', variantId: 'abstract', label: 'Client' },
      selected: true,
    },
  ],
  edges: [
    {
      id: 'connection',
      source: 'client',
      target: 'service',
      type: 'architecture',
      selected: true,
    },
  ],
};

describe('architecture autosave repository', () => {
  it('returns null for corrupt storage and remains usable', () => {
    const storage = new MemoryStorage();
    storage.setItem(ARCHITECTURE_AUTOSAVE_STORAGE_KEY, '{not-json');
    storage.setItem(ARCHITECTURE_STORAGE_MIGRATION_KEY, '1');
    const repository = createLocalStorageArchitectureAutosaveRepository(storage);

    expect(repository.load()).toBeNull();
    expect(repository.save(snapshot)).toBe(true);
    expect(repository.load()).toEqual({
      nodes: [{ ...snapshot.nodes[0], selected: false }],
      edges: [{ ...snapshot.edges[0], selected: false }],
    });
  });

  it('migrates a legacy canvas and records the migration in storage', () => {
    const storage = new MemoryStorage();
    storage.setItem(
      ARCHITECTURE_LEGACY_CANVAS_STORAGE_KEY,
      JSON.stringify([
        {
          id: 'client',
          type: 'rectangle',
          x: 40,
          y: 80,
          customData: { componentKind: 'client', componentVariant: 'abstract' },
        },
        {
          id: 'service',
          type: 'rectangle',
          x: 420,
          y: 80,
          customData: { componentKind: 'service', componentVariant: 'abstract' },
        },
        {
          id: 'connection',
          type: 'arrow',
          startBinding: { elementId: 'client' },
          endBinding: { elementId: 'service' },
        },
      ]),
    );

    const migrated = createLocalStorageArchitectureAutosaveRepository(storage).load();

    expect(migrated?.nodes.map((node) => node.id)).toEqual(['client', 'service']);
    expect(migrated?.edges).toHaveLength(1);
    expect(storage.getItem(ARCHITECTURE_STORAGE_MIGRATION_KEY)).toBe('1');
    expect(JSON.parse(storage.getItem(ARCHITECTURE_AUTOSAVE_STORAGE_KEY) ?? '{}')).toEqual(
      migrated,
    );
  });

  it('keeps a current autosave instead of overwriting it with legacy data', () => {
    const storage = new MemoryStorage();
    storage.setItem(ARCHITECTURE_AUTOSAVE_STORAGE_KEY, JSON.stringify(snapshot));
    storage.setItem(
      ARCHITECTURE_LEGACY_CANVAS_STORAGE_KEY,
      JSON.stringify([
        {
          id: 'legacy',
          type: 'rectangle',
          x: 0,
          y: 0,
          customData: { componentKind: 'service', componentVariant: 'abstract' },
        },
      ]),
    );

    const loaded = createLocalStorageArchitectureAutosaveRepository(storage).load();

    expect(loaded?.nodes[0]?.id).toBe('client');
    expect(storage.getItem(ARCHITECTURE_STORAGE_MIGRATION_KEY)).toBe('1');
  });

  it('reports storage write failures without throwing', () => {
    const storage: KeyValueStorage = {
      getItem: () => null,
      setItem: () => {
        throw new Error('quota exceeded');
      },
    };

    expect(createLocalStorageArchitectureAutosaveRepository(storage).save(snapshot)).toBe(false);
  });
});
