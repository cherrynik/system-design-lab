export type CanvasEventTone = 'neutral' | 'danger';

export type CanvasEventToastProps = {
  message: string;
  tone?: CanvasEventTone;
  actionLabel?: string;
  onAction?: () => void;
};
