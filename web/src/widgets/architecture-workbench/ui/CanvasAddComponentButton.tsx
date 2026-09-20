import { Plus } from 'lucide-react';
import { IconButton } from '@/shared/ui';
import type { CanvasAddComponentButtonProps } from './CanvasAddComponentButton.types';

export function CanvasAddComponentButton({ onAdd }: CanvasAddComponentButtonProps) {
  return (
    <div className="canvas-add-button" data-canvas-overlay>
      <IconButton
        label="Add component to canvas"
        size="icon"
        variant="ghost"
        onClick={(event) => onAdd(event.currentTarget)}
      >
        <Plus size={16} />
      </IconButton>
    </div>
  );
}
