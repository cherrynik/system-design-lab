import { Group } from '@mantine/core';
import { ArrowLeft, LockKeyhole } from 'lucide-react';
import { Button, Tooltip, TooltipContent, TooltipTrigger } from '@/shared/ui';
import type { SolutionCanvasHeaderProps } from './ArchitectureWorkbench.types';

export function SolutionCanvasHeader({ onBack, snapshotLabel }: SolutionCanvasHeaderProps) {
  let readonlyLabel = 'Read-only solution';
  let navigationLabel = 'Solution navigation';
  if (snapshotLabel) {
    readonlyLabel = 'Read-only validation attempt';
    navigationLabel = 'Attempt navigation';
  }
  return (
    <Group
      className="solution-canvas-header"
      gap={4}
      wrap="nowrap"
      role="group"
      aria-label={navigationLabel}
    >
      <Tooltip>
        <TooltipTrigger
          render={
            <span
              className="solution-canvas-header__readonly"
              role="img"
              aria-label={readonlyLabel}
              tabIndex={0}
            />
          }
        >
          <LockKeyhole size={13} aria-hidden="true" />
        </TooltipTrigger>
        <TooltipContent side="bottom">{readonlyLabel}</TooltipContent>
      </Tooltip>
      {snapshotLabel && <span className="solution-canvas-header__label">{snapshotLabel}</span>}
      <Button
        className="solution-canvas-header__back"
        leftSection={<ArrowLeft size={14} aria-hidden="true" />}
        size="xs"
        color="gray"
        variant="ghost"
        onClick={onBack}
      >
        My Canvas
      </Button>
    </Group>
  );
}
