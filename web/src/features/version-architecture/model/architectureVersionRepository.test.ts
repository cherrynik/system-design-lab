import { describe, expect, it } from 'vitest';
import type { ArchitectureVersion } from '../../../entities/architecture';
import { ARCHITECTURE_VERSIONS_STORAGE_KEY } from '../../../shared/config';
import type { KeyValueStorage } from '../../../shared/lib';
import { createLocalStorageArchitectureVersionRepository } from './architectureVersionRepository';

class MemoryStorage implements KeyValueStorage {
  private readonly values = new Map<string, string>();

  getItem(key: string) {
    return this.values.get(key) ?? null;
  }

  setItem(key: string, value: string) {
    this.values.set(key, value);
  }
}

const version: ArchitectureVersion = {
  id: 'version-1',
  name: 'Commit 1',
  createdAt: '2026-09-18T12:00:00.000Z',
  nodes: [
    {
      id: 'client',
      type: 'architecture',
      position: { x: 10, y: 20 },
      data: { kind: 'client', variantId: 'abstract', label: 'Client' },
      selected: true,
    },
  ],
  edges: [],
};

describe('architecture version repository', () => {
  it('returns an empty history for corrupt storage', () => {
    const storage = new MemoryStorage();
    storage.setItem(ARCHITECTURE_VERSIONS_STORAGE_KEY, '{not-json');

    expect(createLocalStorageArchitectureVersionRepository(storage).load()).toEqual([]);
  });

  it('migrates legacy names and persists the normalized history', () => {
    const storage = new MemoryStorage();
    storage.setItem(
      ARCHITECTURE_VERSIONS_STORAGE_KEY,
      JSON.stringify([{ ...version, name: 'ArchitectureVersion 1' }]),
    );

    const versions = createLocalStorageArchitectureVersionRepository(storage).load();

    expect(versions[0]?.name).toBe('Commit 1');
    expect(JSON.parse(storage.getItem(ARCHITECTURE_VERSIONS_STORAGE_KEY) ?? '[]')[0].name).toBe(
      'Commit 1',
    );
  });

  it('does not persist transient selection state', () => {
    const storage = new MemoryStorage();
    const repository = createLocalStorageArchitectureVersionRepository(storage);

    expect(repository.save([version])).toBe(true);
    expect(repository.load()[0]?.nodes[0]?.selected).toBe(false);
  });
});
