type Props = {
  message: string;
  tone?: 'neutral' | 'danger';
  actionLabel?: string;
  onAction?: () => void;
};

export function CanvasEventToast({ message, tone = 'neutral', actionLabel, onAction }: Props) {
  return <div className={`canvas-event-toast canvas-event-toast--${tone}`} role="status" aria-live="polite">
    <i aria-hidden="true" />
    <span>{message}</span>
    {actionLabel && onAction && <button type="button" onClick={onAction}>{actionLabel}</button>}
  </div>;
}
