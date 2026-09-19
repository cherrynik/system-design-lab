import { Loader, Stack, Text } from '@mantine/core';

export function CanvasLoadingState() {
  return (
    <Stack className="canvas-loading-state" align="center" justify="center" gap="xs" role="status">
      <Loader size="sm" type="dots" />
      <Text size="xs" c="dimmed">
        Preparing canvas
      </Text>
    </Stack>
  );
}
