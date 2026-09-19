import { useEffect } from 'react';
import type { OrphanAnchorCleanupOptions } from './OrphanAnchorCleanup.types';

export function useOrphanAnchorCleanup({
  nodes,
  edges,
  replacePresent,
}: OrphanAnchorCleanupOptions) {
  useEffect(() => {
    const referenced = new Set(edges.flatMap((edge) => [edge.source, edge.target]));
    const hasOrphan = nodes.some((node) => node.data.isAnchor && !referenced.has(node.id));
    if (!hasOrphan) return;
    replacePresent((current) => ({
      ...current,
      nodes: current.nodes.filter((node) => !node.data.isAnchor || referenced.has(node.id)),
    }));
  }, [edges, nodes, replacePresent]);
}
