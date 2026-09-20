import { Group, Notification, Text } from '@mantine/core';
import { CheckCircle2, Trash2 } from 'lucide-react';
import { Button } from '@/shared/ui';
import type { CanvasEventToastProps, CanvasEventTone } from './CanvasEventToast.types';

function getNotificationColor(tone: CanvasEventTone) {
  if (tone === 'danger') return 'red';
  return 'platformSignal';
}

function getNotificationIcon(tone: CanvasEventTone) {
  if (tone === 'danger') return <Trash2 size={15} />;
  return <CheckCircle2 size={15} />;
}

export function CanvasEventToast({
  message,
  tone = 'neutral',
  actionLabel,
  onAction,
}: CanvasEventToastProps) {
  const color = getNotificationColor(tone);
  const icon = getNotificationIcon(tone);

  return (
    <Notification
      className={`canvas-event-toast canvas-event-toast--${tone}`}
      color={color}
      icon={icon}
      withCloseButton={false}
      role="status"
      aria-live="polite"
    >
      <Group gap={10} wrap="nowrap">
        <Text size="sm">{message}</Text>
        {actionLabel && onAction && (
          <Button size="xs" variant="ghost" color={color} onClick={onAction}>
            {actionLabel}
          </Button>
        )}
      </Group>
    </Notification>
  );
}
