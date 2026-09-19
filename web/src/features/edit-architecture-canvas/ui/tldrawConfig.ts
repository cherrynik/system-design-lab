import type { TLComponents } from 'tldraw';
import { ArchitectureCardShapeUtil } from './ArchitectureCardShapeUtil';
import { ArchitectureInspectorOverlay } from './ArchitectureInspectorOverlay';

export const architectureShapeUtils = [ArchitectureCardShapeUtil];

export const architectureTldrawComponents = {
  ContextMenu: null,
  InFrontOfTheCanvas: ArchitectureInspectorOverlay,
} satisfies TLComponents;
