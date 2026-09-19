import type { HotspotSide } from './architectureCanvas.types';

export const hotspotSides: HotspotSide[] = ['top', 'right', 'bottom', 'left'];

export const hotspotAnchor: Record<HotspotSide, { x: number; y: number }> = {
  top: { x: 0.5, y: 0 },
  right: { x: 1, y: 0.5 },
  bottom: { x: 0.5, y: 1 },
  left: { x: 0, y: 0.5 },
};
