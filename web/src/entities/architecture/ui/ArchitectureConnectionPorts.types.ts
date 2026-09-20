import type { ArchitectureNode, ArchitectureNodeKind } from '../model/architecture.types';
import type {
  ArchitectureConnectionDirection,
  ArchitectureNodeConnectionState,
} from '../model/connections.types';

export type ArchitectureConnectionPortsProps = {
  kind: ArchitectureNodeKind;
  connectionState: ArchitectureNodeConnectionState;
};

export type ArchitectureConnectionPortProps = {
  direction: ArchitectureConnectionDirection;
  connections: readonly ArchitectureNode[];
};
