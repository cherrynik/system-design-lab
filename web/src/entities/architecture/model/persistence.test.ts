// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import {
  AUTOSAVE_KEY,
  parseArchitectureSnapshot,
  readArchitectureSnapshot,
  readArchitectureVersions,
  VERSIONS_KEY,
} from './persistence';

afterEach(() => localStorage.clear());

describe('architecture persistence parsing', () => {
  it('reads a legacy canvas as renderer-independent domain data without writing storage', () => {
    localStorage.setItem(
      'system-design-lab:canvas',
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

    expect(readArchitectureSnapshot()).toEqual({
      nodes: [
        {
          id: 'client',
          type: 'architecture',
          position: { x: 40, y: 80 },
          data: { kind: 'client', variantId: 'abstract', label: 'Client' },
        },
        {
          id: 'service',
          type: 'architecture',
          position: { x: 420, y: 80 },
          data: { kind: 'service', variantId: 'abstract', label: 'Service' },
        },
      ],
      edges: [
        {
          id: 'connection',
          source: 'client',
          target: 'service',
          type: 'architecture',
          data: { protocol: 'HTTPS' },
          label: 'HTTPS',
        },
      ],
    });
    expect(localStorage.getItem('system-design-lab:react-flow-migrated')).toBeNull();
  });

  it('migrates legacy version names to commit terminology', () => {
    localStorage.setItem(
      VERSIONS_KEY,
      JSON.stringify([
        {
          id: 'version-1',
          name: 'ArchitectureVersion 1',
          createdAt: '2026-09-18T12:00:00.000Z',
          nodes: [],
          edges: [],
        },
      ]),
    );

    expect(readArchitectureVersions()[0]?.name).toBe('Commit 1');
    expect(JSON.parse(localStorage.getItem(VERSIONS_KEY) ?? '[]')[0]?.name).toBe(
      'ArchitectureVersion 1',
    );
  });

  it('rejects corrupt and structurally invalid snapshots', () => {
    expect(parseArchitectureSnapshot('{not-json')).toBeNull();
    expect(parseArchitectureSnapshot(JSON.stringify({ nodes: [] }))).toBeNull();
    expect(parseArchitectureSnapshot(JSON.stringify({ nodes: [null], edges: [] }))).toBeNull();
    expect(
      parseArchitectureSnapshot(
        JSON.stringify({
          nodes: [
            {
              id: 'client',
              type: 'architecture',
              position: { x: 10, y: 20 },
              data: { kind: 'database', variantId: 'abstract', label: 'Database' },
            },
          ],
          edges: [],
        }),
      ),
    ).toBeNull();
  });

  it.each([
    ['a missing id', { type: 'architecture', position: { x: 10, y: 20 }, data: {} }],
    [
      'a partial position',
      {
        id: 'client',
        type: 'architecture',
        position: { x: 10 },
        data: { kind: 'client', variantId: 'abstract', label: 'Client' },
      },
    ],
    [
      'non-finite coordinates',
      {
        id: 'client',
        type: 'architecture',
        position: { x: null, y: 20 },
        data: { kind: 'client', variantId: 'abstract', label: 'Client' },
      },
    ],
    [
      'partial node data',
      {
        id: 'client',
        type: 'architecture',
        position: { x: 10, y: 20 },
        data: { kind: 'client', label: 'Client' },
      },
    ],
    [
      'null node data',
      {
        id: 'client',
        type: 'architecture',
        position: { x: 10, y: 20 },
        data: null,
      },
    ],
    [
      'the wrong node type',
      {
        id: 'client',
        type: 'default',
        position: { x: 10, y: 20 },
        data: { kind: 'client', variantId: 'abstract', label: 'Client' },
      },
    ],
    [
      'an invalid anchor flag',
      {
        id: 'client',
        type: 'architecture',
        position: { x: 10, y: 20 },
        data: { kind: 'client', variantId: 'abstract', label: 'Client', isAnchor: 'yes' },
      },
    ],
  ])('rejects a node with %s', (_case, node) => {
    expect(parseArchitectureSnapshot(JSON.stringify({ nodes: [node], edges: [] }))).toBeNull();
  });

  it.each([
    ['a null entry', null],
    ['a missing id', { source: 'client', target: 'service', type: 'architecture' }],
    ['a missing target', { id: 'request', source: 'client', type: 'architecture' }],
    [
      'the wrong type',
      {
        id: 'request',
        source: 'client',
        target: 'service',
        type: 'default',
      },
    ],
    [
      'partial data',
      {
        id: 'request',
        source: 'client',
        target: 'service',
        type: 'architecture',
        data: { sourceAnchor: { side: 'right', offset: 0.5 } },
      },
    ],
    [
      'null data',
      {
        id: 'request',
        source: 'client',
        target: 'service',
        type: 'architecture',
        data: null,
      },
    ],
    [
      'an unknown anchor side',
      {
        id: 'request',
        source: 'client',
        target: 'service',
        type: 'architecture',
        data: { protocol: 'HTTPS', sourceAnchor: { side: 'center', offset: 0.5 } },
      },
    ],
    [
      'an out-of-range anchor offset',
      {
        id: 'request',
        source: 'client',
        target: 'service',
        type: 'architecture',
        data: { protocol: 'HTTPS', targetAnchor: { side: 'left', offset: 1.5 } },
      },
    ],
    [
      'a partial bend',
      {
        id: 'request',
        source: 'client',
        target: 'service',
        type: 'architecture',
        data: { protocol: 'HTTPS', bend: { along: 0.5 } },
      },
    ],
  ])('rejects an edge with %s', (_case, edge) => {
    expect(parseArchitectureSnapshot(JSON.stringify({ nodes: [], edges: [edge] }))).toBeNull();
  });

  it('accepts and normalizes a complete snapshot with free-end anchors', () => {
    const snapshot = {
      nodes: [
        {
          id: 'client',
          type: 'architecture',
          position: { x: 10, y: 20 },
          data: { kind: 'client', variantId: 'abstract', label: 'Client' },
          selected: true,
        },
        {
          id: 'anchor-request-end',
          type: 'architecture',
          position: { x: 320, y: 180 },
          data: { kind: 'service', variantId: 'anchor', label: '', isAnchor: true },
        },
      ],
      edges: [
        {
          id: 'request',
          source: 'client',
          target: 'anchor-request-end',
          type: 'architecture',
          label: '',
          selected: true,
          data: {
            protocol: '',
            bend: { along: 0.45, normal: 24 },
            sourceAnchor: { side: 'right', offset: 0.5 },
          },
        },
      ],
    };

    expect(parseArchitectureSnapshot(JSON.stringify(snapshot))).toEqual({
      nodes: snapshot.nodes.map((node) => ({ ...node, selected: false })),
      edges: snapshot.edges.map((edge) => ({ ...edge, selected: false })),
    });
  });

  it.each([undefined, 'auto', 'manual'])(
    'preserves protocol intent %s, including a blank label',
    (protocolMode) => {
      const snapshot = {
        nodes: [],
        edges: [
          {
            id: 'request',
            type: 'architecture',
            source: 'client',
            target: 'service',
            data: { protocol: '', protocolMode },
          },
        ],
      };
      expect(parseArchitectureSnapshot(JSON.stringify(snapshot))?.edges[0].data).toEqual(
        snapshot.edges[0].data,
      );
    },
  );

  it.each(['unknown', null, 1])('rejects invalid protocol intent %s', (protocolMode) => {
    const snapshot = {
      nodes: [],
      edges: [
        {
          id: 'request',
          type: 'architecture',
          source: 'client',
          target: 'service',
          data: { protocol: '', protocolMode },
        },
      ],
    };
    expect(parseArchitectureSnapshot(JSON.stringify(snapshot))).toBeNull();
  });

  it.each([undefined, 0, 11, 10.5])('preserves port gap %s through autosave and commits', (gap) => {
    const edge = {
      id: 'port-connection',
      type: 'architecture',
      source: 'client',
      target: 'service',
      data: {
        protocol: 'HTTPS',
        sourceAnchor: { side: 'right', offset: 0.5, gap },
      },
    };
    const snapshot = { nodes: [], edges: [edge] };
    const parsed = parseArchitectureSnapshot(JSON.stringify(snapshot));
    expect(parsed?.edges[0].data?.sourceAnchor).toEqual(edge.data.sourceAnchor);
    localStorage.setItem(
      VERSIONS_KEY,
      JSON.stringify([
        { ...snapshot, id: 'commit', name: 'Connected client', createdAt: '2026-09-20T00:00:00Z' },
      ]),
    );
    expect(readArchitectureVersions()[0]?.edges[0].data?.sourceAnchor).toEqual(
      edge.data.sourceAnchor,
    );
  });

  it.each([-1, NaN, Infinity, '11', null])('rejects malformed port gap %s', (gap) => {
    for (const terminal of ['sourceAnchor', 'targetAnchor']) {
      const snapshot = {
        nodes: [],
        edges: [
          {
            id: 'port-connection',
            type: 'architecture',
            source: 'client',
            target: 'service',
            data: { protocol: 'HTTPS', [terminal]: { side: 'right', offset: 0.5, gap } },
          },
        ],
      };
      expect(parseArchitectureSnapshot(JSON.stringify(snapshot))).toBeNull();
    }
  });

  it('falls back to the initial architecture when the saved snapshot is malformed', () => {
    localStorage.setItem('system-design-lab:react-flow-migrated', '1');
    localStorage.setItem(AUTOSAVE_KEY, JSON.stringify({ nodes: [null], edges: [] }));

    const snapshot = readArchitectureSnapshot();

    expect(snapshot.nodes).toHaveLength(2);
    expect(snapshot.nodes.map((node) => node.data.label)).toEqual(['Client', 'Service']);
    expect(snapshot.edges).toEqual([]);
  });

  it('rejects duplicate node and edge ids', () => {
    const node = {
      id: 'duplicate',
      type: 'architecture',
      position: { x: 10, y: 20 },
      data: { kind: 'client', variantId: 'abstract', label: 'Client' },
    };
    const edge = {
      id: 'duplicate',
      source: 'client',
      target: 'service',
      type: 'architecture',
    };

    expect(
      parseArchitectureSnapshot(JSON.stringify({ nodes: [node, node], edges: [] })),
    ).toBeNull();
    expect(
      parseArchitectureSnapshot(JSON.stringify({ nodes: [], edges: [edge, edge] })),
    ).toBeNull();
  });
});
