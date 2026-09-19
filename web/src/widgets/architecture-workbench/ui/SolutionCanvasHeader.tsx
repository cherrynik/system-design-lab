import { Group, Paper, Stack, Text, Title } from '@mantine/core';
import { ArrowLeft, LockKeyhole } from 'lucide-react';
import { Badge, Button } from '@/shared/ui';
import type { SolutionCanvasHeaderProps } from './ArchitectureWorkbench.types';

export function SolutionCanvasHeader({ solution, onBack }: SolutionCanvasHeaderProps) {
  return (
    <Paper className="solution-canvas-header" shadow="lg">
      <Group justify="space-between" gap="md" wrap="nowrap">
        <Stack gap={3} className="solution-canvas-header__copy">
          <Group gap="xs">
            <Badge size="xs" variant="info" leftSection={<LockKeyhole size={10} />}>
              Reference solution
            </Badge>
            <Title order={2} size="sm">
              {solution.name}
            </Title>
          </Group>
          <Text size="xs" c="dimmed" lineClamp={1}>
            {solution.description}
          </Text>
        </Stack>
        <Button
          leftSection={<ArrowLeft size={14} />}
          size="sm"
          color="gray"
          variant="ghost"
          onClick={onBack}
        >
          My Canvas
        </Button>
      </Group>
    </Paper>
  );
}
