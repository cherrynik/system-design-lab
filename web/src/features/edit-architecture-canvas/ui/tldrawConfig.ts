import type { TLComponents } from 'tldraw';
import { ArchitecturePortBindingUtil } from '../model/ArchitecturePortBindingUtil';
import { ArchitectureCardShapeUtil } from './ArchitectureCardShapeUtil';
import { ArchitectureInspectorOverlay } from './ArchitectureInspectorOverlay';

export const architectureBindingUtils = [ArchitecturePortBindingUtil];

export const architectureShapeUtils = [ArchitectureCardShapeUtil];

export const architectureTldrawComponents = {
  ContextMenu: null,
  InFrontOfTheCanvas: ArchitectureInspectorOverlay,
} satisfies TLComponents;
