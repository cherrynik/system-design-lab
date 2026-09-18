import type { ArchitectureSnapshot, ArchitectureVersion } from '../../../entities/architecture';

function architectureContent(snapshot: ArchitectureSnapshot) {
  return {
    nodes: snapshot.nodes.map((node) => ({
      id: node.id,
      position: node.position,
      data: node.data,
    })).sort((left, right) => left.id.localeCompare(right.id)),
    edges: snapshot.edges.map((edge) => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      data: edge.data,
    })).sort((left, right) => left.id.localeCompare(right.id)),
  };
}

export function hasUncommittedArchitectureChanges(snapshot: ArchitectureSnapshot, latestCommit?: ArchitectureVersion) {
  if (!latestCommit) return true;
  return JSON.stringify(architectureContent(snapshot)) !== JSON.stringify(architectureContent(latestCommit));
}
