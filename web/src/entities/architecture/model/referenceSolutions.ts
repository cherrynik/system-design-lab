import { getConnectionProtocol } from './catalog';
import type { ArchitectureSnapshot } from './architecture.types';
import type { ReferenceSolution, ReferenceSolutionConnection } from './referenceSolutions.types';

export type { ReferenceSolution } from './referenceSolutions.types';

export const referenceSolutions = [
  {
    id: 'direct-service',
    name: 'Direct Client → Service',
    description: 'The smallest valid request path for this requirement.',
    nodes: [
      { kind: 'client', variantId: 'web-browser', label: 'Web Browser' },
      { kind: 'service', variantId: 'go-http-api', label: 'Go HTTP API' },
    ],
  },
  {
    id: 'load-balanced',
    name: 'Load Balancer Path',
    description: 'Routes traffic through a dedicated reverse proxy.',
    nodes: [
      { kind: 'client', variantId: 'web-browser', label: 'Web Browser' },
      { kind: 'load-balancer', variantId: 'nginx', label: 'NGINX' },
      { kind: 'service', variantId: 'go-http-api', label: 'Go HTTP API' },
    ],
  },
] satisfies ReferenceSolution[];

const solutionStartX = 80;
const solutionStartY = 160;
const solutionNodeGap = 320;

export function createReferenceSolutionSnapshot(solution: ReferenceSolution): ArchitectureSnapshot {
  const nodes = solution.nodes.map((node, index) => ({
    id: `${solution.id}-node-${index + 1}`,
    type: 'architecture' as const,
    position: {
      x: solutionStartX + index * solutionNodeGap,
      y: solutionStartY,
    },
    data: { ...node },
  }));
  const connections: readonly ReferenceSolutionConnection[] =
    solution.connections ??
    nodes.slice(1).map((_, index) => ({ source: index, target: index + 1 }));
  const edges = connections.flatMap((connection, index) => {
    const source = nodes[connection.source];
    const target = nodes[connection.target];
    if (!source || !target) return [];

    const protocol = connection.protocol ?? getConnectionProtocol(source.data.kind);
    return [
      {
        id: `${solution.id}-edge-${index + 1}`,
        source: source.id,
        target: target.id,
        type: 'architecture' as const,
        label: protocol,
        data: { protocol },
      },
    ];
  });
  return { nodes, edges };
}
