import { Group, Paper } from '@mantine/core';
import { Redo2, Undo2 } from 'lucide-react';
import { IconButton, Tooltip, TooltipContent, TooltipTrigger } from '@/shared/ui';
import type { CanvasHistoryControlsProps } from './CanvasHistoryControls.types';

export function CanvasHistoryControls({
  canUndo,
  canRedo,
  usesCommandKey,
  onUndo,
  onRedo,
}: CanvasHistoryControlsProps) {
  let undoShortcut = 'Ctrl Z';
  let redoShortcut = 'Ctrl Shift Z';
  if (usesCommandKey) {
    undoShortcut = '⌘ Z';
    redoShortcut = '⇧ ⌘ Z';
  }

  return (
    <Paper
      className="canvas-history-controls"
      component="nav"
      aria-label="Canvas history"
      shadow="md"
    >
      <Group gap={2} wrap="nowrap">
        <Tooltip>
          <TooltipTrigger
            render={
              <IconButton
                label="Undo"
                color="gray"
                variant="ghost"
                size="icon-sm"
                disabled={!canUndo}
                onClick={onUndo}
              />
            }
          >
            <Undo2 size={16} />
          </TooltipTrigger>
          <TooltipContent>{`Undo · ${undoShortcut}`}</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger
            render={
              <IconButton
                label="Redo"
                color="gray"
                variant="ghost"
                size="icon-sm"
                disabled={!canRedo}
                onClick={onRedo}
              />
            }
          >
            <Redo2 size={16} />
          </TooltipTrigger>
          <TooltipContent>{`Redo · ${redoShortcut}`}</TooltipContent>
        </Tooltip>
      </Group>
    </Paper>
  );
}
