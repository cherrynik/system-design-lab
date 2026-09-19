import type { ArchitectureNodeKind } from '@/entities/architecture';

export interface ArchitecturePayload {
  nodes: { id: string; kind: ArchitectureNodeKind }[];
  edges: { from: string; to: string }[];
}
