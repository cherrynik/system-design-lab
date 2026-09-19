import type { Dispatch, SetStateAction } from 'react';
import type {
  ArchitectureNode,
  ArchitectureNodeKind,
  ArchitectureSnapshot,
} from '@/entities/architecture';
import type { ComponentContextMenu } from '@/widgets/requirement-sidebar';
import type { CanvasEventController } from './CanvasEvents.types';

export type ArchitectureSnapshotUpdater = (
  update: (current: ArchitectureSnapshot) => ArchitectureSnapshot,
) => void;

export type ArchitectureNodeActionsOptions = {
  nodes: ArchitectureNode[];
  applyChange: ArchitectureSnapshotUpdater;
  replacePresent: ArchitectureSnapshotUpdater;
  focusShape: (nodeId: string) => void;
  selectShape: (nodeId: string) => void;
  setRegistryOpen: Dispatch<SetStateAction<boolean>>;
  setGroup: Dispatch<SetStateAction<ArchitectureNodeKind | null>>;
  setMenu: Dispatch<SetStateAction<ComponentContextMenu | null>>;
  setInspectorId: Dispatch<SetStateAction<string | null>>;
  showEvent: CanvasEventController['show'];
};

export type ArchitectureNodeActions = {
  updateVariant: (id: string, variantId: string) => void;
  renameNode: (id: string, label: string) => void;
  reportCanvasRename: (id: string, label: string) => void;
  addNode: (kind: ArchitectureNodeKind, variantId?: string) => void;
  deleteNode: (id: string) => void;
  focusNode: (id: string) => void;
  inspectNode: (id: string) => void;
};
