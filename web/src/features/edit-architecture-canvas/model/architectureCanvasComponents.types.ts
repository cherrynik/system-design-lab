import type { Editor } from 'tldraw';
import type { ArchitectureNodeKind } from '@/entities/architecture';
import type { ArchitectureCardShape } from './architectureCanvas.types';
import type { HotspotSide } from './architectureCanvas.types';

export type ArchitectureCardContentProps = {
  shape: ArchitectureCardShape;
};

export type ArchitectureCardNameInputProps = {
  shape: ArchitectureCardShape;
  editor: Editor;
  onRename: (nodeId: string, label: string) => void;
};

export type ArchitectureCardHotspotProps = {
  shape: ArchitectureCardShape;
  side: HotspotSide;
  visible: boolean;
  disabled: boolean;
};

export type ArchitectureValidationBadgeProps = {
  status: ArchitectureCardShape['props']['validation'];
  message: string;
};

export type ArchitectureInspectorVariantButtonProps = {
  kind: ArchitectureNodeKind;
  nodeId: string;
  variantId: string;
  active: boolean;
};
