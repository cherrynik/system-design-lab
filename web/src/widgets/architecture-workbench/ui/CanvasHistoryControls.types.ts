export type CanvasHistoryControlsProps = {
  canUndo: boolean;
  canRedo: boolean;
  usesCommandKey: boolean;
  onUndo: () => void;
  onRedo: () => void;
};
