import type {
  ArchitectureEdge,
  ArchitectureNode,
  ArchitectureNodeKind,
} from './architecture.types';
import type {
  ArchitectureConnectionDirection,
  ArchitectureNodeConnectionState,
} from './connections.types';

export type {
  ArchitectureConnectionDirection,
  ArchitectureNodeConnectionState,
} from './connections.types';

const requiredDirections: Record<ArchitectureNodeKind, ArchitectureConnectionDirection[]> = {
  client: ['outgoing'],
  'load-balancer': ['incoming', 'outgoing'],
  service: ['incoming'],
};

export function getArchitectureNodeConnectionStates(
  nodes: ArchitectureNode[],
  edges: ArchitectureEdge[],
): Map<string, ArchitectureNodeConnectionState> {
  const components = nodes.filter((node) => !node.data.isAnchor);
  const byId = new Map(components.map((node) => [node.id, node]));
  const incoming = new Map<string, ArchitectureNode[]>();
  const outgoing = new Map<string, ArchitectureNode[]>();

  for (const edge of edges) {
    const source = byId.get(edge.source);
    const target = byId.get(edge.target);
    if (!source || !target) continue;
    outgoing.set(source.id, [...(outgoing.get(source.id) ?? []), target]);
    incoming.set(target.id, [...(incoming.get(target.id) ?? []), source]);
  }

  return new Map(
    components.map((node) => {
      const nodeIncoming = incoming.get(node.id) ?? [];
      const nodeOutgoing = outgoing.get(node.id) ?? [];
      const missing = requiredDirections[node.data.kind].filter((direction) =>
        direction === 'incoming' ? nodeIncoming.length === 0 : nodeOutgoing.length === 0,
      );
      const connectionCount = nodeIncoming.length + nodeOutgoing.length;
      return [
        node.id,
        {
          state: missing.length === 0 ? 'ready' : connectionCount === 0 ? 'isolated' : 'incomplete',
          incoming: nodeIncoming,
          outgoing: nodeOutgoing,
          missing,
        },
      ];
    }),
  );
}

export function getConnectionStateText(connection: ArchitectureNodeConnectionState): string {
  const parts = [
    connection.incoming.length
      ? `← ${connection.incoming.map((node) => node.data.label).join(', ')}`
      : '',
    connection.outgoing.length
      ? `→ ${connection.outgoing.map((node) => node.data.label).join(', ')}`
      : '',
    ...connection.missing.map((direction) =>
      direction === 'incoming' ? 'Connect input' : 'Connect output',
    ),
  ].filter(Boolean);
  return parts.join(' · ');
}
