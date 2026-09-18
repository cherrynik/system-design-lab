// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { readArchitectureVersions, VERSIONS_KEY } from './persistence';

afterEach(() => localStorage.clear());

describe('architecture commit persistence', () => {
  it('migrates legacy version names to commit terminology', () => {
    localStorage.setItem(VERSIONS_KEY, JSON.stringify([{
      id: 'version-1',
      name: 'ArchitectureVersion 1',
      createdAt: '2026-09-18T12:00:00.000Z',
      nodes: [],
      edges: [],
    }]));

    expect(readArchitectureVersions()[0]?.name).toBe('Commit 1');
    expect(JSON.parse(localStorage.getItem(VERSIONS_KEY) ?? '[]')[0]?.name).toBe('Commit 1');
  });
});
