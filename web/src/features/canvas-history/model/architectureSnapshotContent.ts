import type { ArchitectureSnapshot, EdgeAnchor } from '@/entities/architecture';

function anchorContent(anchor: EdgeAnchor | undefined) {
  if (!anchor) return null;
  return [anchor.side, anchor.offset, anchor.gap ?? 0];
}

export function architectureSnapshotContent({ nodes, edges }: ArchitectureSnapshot) {
  // Compare document meaning: the canvas adds defaults and may reorder records
  // when it echoes an external edit. Neither belongs in undo history.
  return JSON.stringify({
    nodes: nodes
      .map(({ id, position, data }) => ({
        id,
        x: position.x,
        y: position.y,
        kind: data.kind,
        variantId: data.variantId,
        label: data.label,
        isAnchor: data.isAnchor ?? false,
      }))
      .sort((left, right) => left.id.localeCompare(right.id)),
    edges: edges
      .map(({ id, source, target, label, data }) => ({
        id,
        source,
        target,
        protocol: data?.protocol ?? label ?? '',
        protocolMode: data?.protocolMode ?? 'manual',
        bendAlong: data?.bend?.along ?? 0.5,
        bendNormal: data?.bend?.normal ?? 0,
        sourceAnchor: anchorContent(data?.sourceAnchor),
        targetAnchor: anchorContent(data?.targetAnchor),
      }))
      .sort((left, right) => left.id.localeCompare(right.id)),
  });
}
