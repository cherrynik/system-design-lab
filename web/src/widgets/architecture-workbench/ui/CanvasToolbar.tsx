import { Hand, MousePointer2, MoveRight } from 'lucide-react';
import {
  Kbd,
  Toolbar,
  ToolbarIconButton,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/shared/ui';
import type { CanvasToolDefinition, CanvasToolbarProps } from './ArchitectureWorkbench.types';

const tools: CanvasToolDefinition[] = [
  { id: 'hand', label: 'Pan canvas', shortcut: '1', icon: <Hand size={17} /> },
  { id: 'selection', label: 'Select', shortcut: '2', icon: <MousePointer2 size={17} /> },
  { id: 'connection', label: 'Connect', shortcut: '3', icon: <MoveRight size={17} /> },
];

export function CanvasToolbar({ tool, onToolChange }: CanvasToolbarProps) {
  return (
    <Toolbar aria-label="Canvas tools" className="canvas-toolbar" gap={2}>
      {tools.map((item) => {
        const active = item.id === tool;
        return (
          <Tooltip key={item.id}>
            <TooltipTrigger
              render={
                <ToolbarIconButton
                  label={`${item.label} (${item.shortcut})`}
                  aria-pressed={active}
                  className="canvas-toolbar__action"
                  color="platformSignal"
                  size="icon"
                  variant={getToolVariant(active)}
                  onClick={() => onToolChange(item.id)}
                />
              }
            >
              {item.icon}
              <Kbd className="canvas-toolbar__shortcut" size="xs">
                {item.shortcut}
              </Kbd>
            </TooltipTrigger>
            <TooltipContent>{`${item.label} · ${item.shortcut}`}</TooltipContent>
          </Tooltip>
        );
      })}
    </Toolbar>
  );
}

function getToolVariant(active: boolean) {
  if (active) return 'secondary' as const;
  return 'ghost' as const;
}
