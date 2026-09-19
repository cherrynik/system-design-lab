import { Group, Paper } from '@mantine/core';
import { Crosshair, Minus, Plus } from 'lucide-react';
import { IconButton, Tooltip, TooltipContent, TooltipTrigger } from '@/shared/ui';
import type { CanvasZoomControlsProps } from './ArchitectureWorkbench.types';

export function CanvasZoomControls({ editorRef }: CanvasZoomControlsProps) {
  const zoomOut = () => {
    editorRef.current?.zoomOut(undefined, { animation: { duration: 120 } });
  };
  const zoomToFit = () => {
    editorRef.current?.zoomToFit({ animation: { duration: 160 } });
  };
  const zoomIn = () => {
    editorRef.current?.zoomIn(undefined, { animation: { duration: 120 } });
  };

  return (
    <Paper className="canvas-zoom-controls" component="nav" aria-label="Canvas zoom" shadow="md">
      <Group gap={2} wrap="nowrap">
        <Tooltip>
          <TooltipTrigger
            render={
              <IconButton
                label="Zoom out"
                color="gray"
                variant="ghost"
                size="icon-sm"
                onClick={zoomOut}
              />
            }
          >
            <Minus size={16} />
          </TooltipTrigger>
          <TooltipContent>Zoom out</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger
            render={
              <IconButton
                label="Fit canvas"
                color="gray"
                variant="ghost"
                size="icon-sm"
                onClick={zoomToFit}
              />
            }
          >
            <Crosshair size={16} />
          </TooltipTrigger>
          <TooltipContent>Fit canvas</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger
            render={
              <IconButton
                label="Zoom in"
                color="gray"
                variant="ghost"
                size="icon-sm"
                onClick={zoomIn}
              />
            }
          >
            <Plus size={16} />
          </TooltipTrigger>
          <TooltipContent>Zoom in</TooltipContent>
        </Tooltip>
      </Group>
    </Paper>
  );
}
