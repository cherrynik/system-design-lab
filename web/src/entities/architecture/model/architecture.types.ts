export type ArchitectureNodeKind = 'client' | 'load-balancer' | 'service';
export type EdgeAnchor = {
  side: 'top' | 'right' | 'bottom' | 'left';
  offset: number;
  gap?: number;
};
export type ArchitectureAttachment = {
  normalizedAnchor: { x: number; y: number };
  isPrecise: boolean;
  isExact: boolean;
  snap: 'none' | 'center' | 'edge' | 'edge-point';
};
export type ArchitectureNodeData = {
  kind: ArchitectureNodeKind;
  variantId: string;
  label: string;
  isAnchor?: boolean;
};
export type ArchitectureNode = {
  id: string;
  type: 'architecture';
  position: { x: number; y: number };
  data: ArchitectureNodeData;
  selected?: boolean;
};
export type ArchitectureEdge = {
  id: string;
  source: string;
  target: string;
  type: 'architecture';
  data?: {
    protocol: string;
    protocolMode?: 'auto' | 'manual';
    bend?: { along: number; normal: number };
    sourceAnchor?: EdgeAnchor;
    targetAnchor?: EdgeAnchor;
    sourceAttachment?: ArchitectureAttachment;
    targetAttachment?: ArchitectureAttachment;
  };
  label?: string;
  selected?: boolean;
};
export type ArchitectureSnapshot = { nodes: ArchitectureNode[]; edges: ArchitectureEdge[] };
export type ArchitectureVersion = ArchitectureSnapshot & {
  id: string;
  name: string;
  createdAt: string;
};
