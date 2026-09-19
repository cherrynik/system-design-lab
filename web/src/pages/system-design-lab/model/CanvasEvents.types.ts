import type { CanvasEvent } from '@/widgets/architecture-workbench';

export type TimedCanvasEvent = CanvasEvent & {
  persistent?: boolean;
};

export type CanvasEventController = {
  event: TimedCanvasEvent | null;
  show: (event: TimedCanvasEvent) => void;
};
