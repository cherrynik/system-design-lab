import type { RefObject } from 'react';
import type { ArchitectureNodeConnectionState } from '../model/connections.types';
import type { ArchitectureNodeValidationState } from '../model/nodeValidation.types';
import type { ArchitectureNode } from '../model/architecture.types';

export type ArchitectureLayerItemMode = 'list' | 'graph';

export type ArchitectureLayerItemProps = {
  node: ArchitectureNode;
  fallbackLabel: string;
  connectionState: ArchitectureNodeConnectionState;
  validationState?: ArchitectureNodeValidationState;
  mode?: ArchitectureLayerItemMode;
  onFocus: (nodeId: string) => void;
  onOpenMenu: (nodeId: string, x: number, y: number) => void;
  onRename: (nodeId: string, label: string) => void;
};

export type ArchitectureLayerNameProps = {
  editing: boolean;
  label: string;
  draft: string;
  mode: ArchitectureLayerItemMode;
  connectionState: ArchitectureNodeConnectionState;
  inputRef: RefObject<HTMLInputElement | null>;
  onDraftChange: (draft: string) => void;
  onFinish: () => void;
  onCancel: () => void;
};

export type ArchitectureConnectionSummaryProps = {
  connectionState: ArchitectureNodeConnectionState;
};

export type ArchitectureValidationBadgeProps = {
  label: string;
  validationState?: ArchitectureNodeValidationState;
  compact?: boolean;
};
