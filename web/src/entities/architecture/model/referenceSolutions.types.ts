import type { ArchitectureNodeKind } from './architecture.types';

export type ReferenceSolutionConnection = {
  source: number;
  target: number;
  protocol?: string;
};

export type ReferenceSolution = {
  id: string;
  name: string;
  description: string;
  nodes: Array<{
    kind: ArchitectureNodeKind;
    variantId: string;
    label: string;
  }>;
  connections?: ReferenceSolutionConnection[];
};
