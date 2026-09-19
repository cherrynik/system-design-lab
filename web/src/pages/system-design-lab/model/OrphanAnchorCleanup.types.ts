import type { ArchitectureEdge, ArchitectureNode } from '@/entities/architecture';
import type { ArchitectureSnapshotUpdater } from './ArchitectureNodeActions.types';

export type OrphanAnchorCleanupOptions = {
  nodes: ArchitectureNode[];
  edges: ArchitectureEdge[];
  replacePresent: ArchitectureSnapshotUpdater;
};
