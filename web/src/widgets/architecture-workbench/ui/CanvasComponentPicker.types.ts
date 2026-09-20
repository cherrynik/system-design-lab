import type { ArchitectureNodeKind } from '@/entities/architecture';
export type CanvasComponentPickerProps = {
  connected?: boolean;
  onAdd: (kind: ArchitectureNodeKind, variantId: string) => void;
};
