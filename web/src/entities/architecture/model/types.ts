import type { Edge, Node } from '@xyflow/react';

export type ArchitectureNodeKind = 'client' | 'load-balancer' | 'service';
export type EdgeAnchor = { side: 'top' | 'right' | 'bottom' | 'left'; offset: number };
export type ArchitectureNodeData = { kind: ArchitectureNodeKind; variantId: string; label: string; isAnchor?: boolean };
export type ArchitectureNode = Node<ArchitectureNodeData, 'architecture'>;
export type ArchitectureEdge = Edge<{ protocol: string; bend?: { along: number; normal: number }; sourceAnchor?: EdgeAnchor; targetAnchor?: EdgeAnchor }>;
export type ArchitectureSnapshot = { nodes: ArchitectureNode[]; edges: ArchitectureEdge[] };
export type ArchitectureVersion = ArchitectureSnapshot & { id: string; name: string; createdAt: string };
