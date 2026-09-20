import type {
  ArchitectureSnapshot,
  ArchitectureAttachment,
  ArchitectureNode,
  EdgeAnchor,
} from '@/entities/architecture';

function attachmentContent(
  attachment: ArchitectureAttachment | undefined,
  anchor: EdgeAnchor | undefined,
  preserveAutomaticPoint: boolean,
) {
  if (attachment) {
    let point = { x: 0.5, y: 0.5 };
    if (attachment.isPrecise || preserveAutomaticPoint) point = attachment.normalizedAnchor;
    return [point.x, point.y, attachment.isPrecise, attachment.isExact, attachment.snap];
  }
  if (!anchor || anchor.gap !== undefined) return [0.5, 0.5, false, false, 'none'];
  let x = anchor.offset;
  let y = anchor.offset;
  if (anchor.side === 'top') y = 0;
  if (anchor.side === 'bottom') y = 1;
  if (anchor.side === 'left') x = 0;
  if (anchor.side === 'right') x = 1;
  return [x, y, true, false, 'none'];
}

function hasCoincidentBoundCards(
  source: ArchitectureNode | undefined,
  target: ArchitectureNode | undefined,
) {
  if (!source || !target || source.data.isAnchor || target.data.isAnchor) return false;
  if (source.id === target.id) return true;
  // All cards have the same fixed size. Their bounds can contain one another
  // only at the same position; tldraw then uses the stored automatic anchors.
  return source.position.x === target.position.x && source.position.y === target.position.y;
}

export function architectureSnapshotContent({ nodes, edges }: ArchitectureSnapshot) {
  const nodesById = new Map(nodes.map((node) => [node.id, node]));
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
      .map(({ id, source, target, label, data }) => {
        const preserveAutomaticPoint = hasCoincidentBoundCards(
          nodesById.get(source),
          nodesById.get(target),
        );
        return {
          id,
          source,
          target,
          protocol: data?.protocol ?? label ?? '',
          protocolMode: data?.protocolMode ?? 'manual',
          bendAlong: data?.bend?.along ?? 0.5,
          bendNormal: data?.bend?.normal ?? 0,
          sourceAttachment: attachmentContent(
            data?.sourceAttachment,
            data?.sourceAnchor,
            preserveAutomaticPoint,
          ),
          targetAttachment: attachmentContent(
            data?.targetAttachment,
            data?.targetAnchor,
            preserveAutomaticPoint,
          ),
        };
      })
      .sort((left, right) => left.id.localeCompare(right.id)),
  });
}
