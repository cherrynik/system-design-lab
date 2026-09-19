import type { ArchitectureNodeKind } from '../../../entities/architecture';
import type { ValidationResult } from '../../../entities/exercise';
import type { ArchitecturePayload } from './evaluate-architecture.types';

export type { ArchitecturePayload } from './evaluate-architecture.types';

export function toArchitecturePayload(
  sourceNodes: readonly { id: string; data: { kind: ArchitectureNodeKind; isAnchor?: boolean } }[],
  sourceEdges: readonly { source: string; target: string }[],
): ArchitecturePayload {
  const nodes = sourceNodes
    .filter((node) => !node.data.isAnchor)
    .map((node) => ({ id: node.id, kind: node.data.kind }));
  const nodeIds = new Set(nodes.map((node) => node.id));
  const edges = sourceEdges.flatMap((edge) =>
    nodeIds.has(edge.source) && nodeIds.has(edge.target)
      ? [{ from: edge.source, to: edge.target }]
      : [],
  );
  return { nodes, edges };
}

export async function evaluateArchitecture(
  architecture: ArchitecturePayload,
): Promise<ValidationResult[]> {
  const response = await fetch('/api/evaluate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(architecture),
  });
  if (!response.ok) throw new Error('The architecture could not be evaluated.');
  return ((await response.json()) as { results: ValidationResult[] }).results;
}
