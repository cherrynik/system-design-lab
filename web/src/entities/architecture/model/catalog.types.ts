import type { IconType } from 'react-icons';
import type { ArchitectureNodeKind } from './architecture.types';

export type ArchitectureVariant = {
  id: string;
  label: string;
  description: string;
  type: string;
  capabilities: string[];
  icon: IconType;
  concrete: boolean;
};

export type ArchitectureMeta = Record<ArchitectureNodeKind, { group: string; role: string }>;
