import type { ArchitectureNodeKind } from './architecture.types';

export type LegacyCanvasElement = {
  id: string;
  isDeleted?: boolean;
  type?: string;
  x: number;
  y: number;
  customData?: {
    componentKind?: ArchitectureNodeKind;
    componentVariant?: string;
  };
  startBinding?: { elementId?: string };
  endBinding?: { elementId?: string };
};
