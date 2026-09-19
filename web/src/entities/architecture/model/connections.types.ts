import type { ArchitectureNode } from './architecture.types';

export type ArchitectureConnectionDirection = 'incoming' | 'outgoing';

export type ArchitectureNodeConnectionState = {
  state: 'ready' | 'incomplete' | 'isolated';
  incoming: ArchitectureNode[];
  outgoing: ArchitectureNode[];
  missing: ArchitectureConnectionDirection[];
};
