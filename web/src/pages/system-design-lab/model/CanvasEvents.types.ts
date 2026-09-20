import type { CanvasEvent } from '@/widgets/architecture-workbench';

export type CanvasEventController = {
  event: CanvasEvent | null;
  show: (event: CanvasEvent) => void;
};
