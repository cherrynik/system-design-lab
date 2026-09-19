import type { ArchitectureEdge, ArchitectureNode } from '@/entities/architecture';

export function architectureContentKey(nodes: ArchitectureNode[], edges: ArchitectureEdge[]) {
  return JSON.stringify({
    nodes: nodes
      .map(({ id, position, data }) => ({ id, position, data }))
      .sort((left, right) => left.id.localeCompare(right.id)),
    edges: edges
      .map(({ id, source, target, label, data }) => ({ id, source, target, label, data }))
      .sort((left, right) => left.id.localeCompare(right.id)),
  });
}

export function renderedEdgesKey(nodes: ArchitectureNode[], edges: ArchitectureEdge[]) {
  const referencedNodeIds = new Set(edges.flatMap(({ source, target }) => [source, target]));
  return architectureContentKey(
    nodes.filter(({ id }) => referencedNodeIds.has(id)),
    edges,
  );
}
