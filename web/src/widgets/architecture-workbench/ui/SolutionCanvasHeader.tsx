import { Group } from '@mantine/core';
import { ArrowLeft, LockKeyhole } from 'lucide-react';
import { Button, Tooltip, TooltipContent, TooltipTrigger } from '@/shared/ui';
import type { SolutionCanvasHeaderProps } from './ArchitectureWorkbench.types';

export function SolutionCanvasHeader({ onBack }: SolutionCanvasHeaderProps) {
  return (
    <Group
      className="solution-canvas-header"
      gap={4}
      wrap="nowrap"
      role="group"
      aria-label="Solution navigation"
    >
      <Tooltip>
        <TooltipTrigger
          render={
            <span
              className="solution-canvas-header__readonly"
              role="img"
              aria-label="Read-only solution"
              tabIndex={0}
            />
          }
        >
          <LockKeyhole size={13} aria-hidden="true" />
        </TooltipTrigger>
        <TooltipContent side="bottom">Read-only solution</TooltipContent>
      </Tooltip>
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
