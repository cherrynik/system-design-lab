// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { readArchitectureSnapshot, readArchitectureVersions, VERSIONS_KEY } from './persistence';

afterEach(() => localStorage.clear());

describe('architecture commit persistence', () => {
  it('migrates the legacy canvas into renderer-independent domain data', () => {
    localStorage.setItem('system-design-lab:canvas', JSON.stringify([
      { id: 'client', type: 'rectangle', x: 40, y: 80, customData: { componentKind: 'client', componentVariant: 'abstract' } },
      { id: 'service', type: 'rectangle', x: 420, y: 80, customData: { componentKind: 'service', componentVariant: 'abstract' } },
      { id: 'connection', type: 'arrow', startBinding: { elementId: 'client' }, endBinding: { elementId: 'service' } },
    ]));

    expect(readArchitectureSnapshot()).toEqual({
      nodes: [
        { id: 'client', type: 'architecture', position: { x: 40, y: 80 }, data: { kind: 'client', variantId: 'abstract', label: 'Client' } },
        { id: 'service', type: 'architecture', position: { x: 420, y: 80 }, data: { kind: 'service', variantId: 'abstract', label: 'Service' } },
      ],
      edges: [{ id: 'connection', source: 'client', target: 'service', type: 'architecture', data: { protocol: 'HTTPS' }, label: 'HTTPS' }],
    });
    expect(localStorage.getItem('system-design-lab:react-flow-migrated')).toBe('1');
  });

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
