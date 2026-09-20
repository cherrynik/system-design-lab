import { X } from 'lucide-react';
import { useId } from 'react';
import { IconButton, Popover, PopoverContent, PopoverTrigger } from '@/shared/ui';
import { CanvasFloatingAnchor } from './CanvasFloatingAnchor';
import { CanvasComponentPicker } from './CanvasComponentPicker';
import { ConnectionComponentOffer } from './ConnectionComponentOffer';
import type { CanvasComponentPopoverProps } from './CanvasComponentPopover.types';
import './canvas-creation.css';

export function CanvasComponentPopover({
  request,
  editorRef,
  onClose,
  onAnswer,
  onAdd,
}: CanvasComponentPopoverProps) {
  const titleId = useId();
  let title = 'Add component';
  if (request.connectionId) title = 'Connect a component';
  return (
    <Popover
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      trapFocus={false}
      returnFocus={false}
      withArrow={false}
      width={276}
      floatingStrategy="absolute"
      preventPositionChangeWhenVisible={false}
      withinPortal={false}
      zIndex={180}
    >
      <CanvasFloatingAnchor editorRef={editorRef} anchor={request.anchor} zIndex={180}>
        <PopoverTrigger>
          <span aria-hidden="true" className="canvas-component-popover__anchor" />
        </PopoverTrigger>
        <PopoverContent
          side="bottom"
          align="start"
          sideOffset={8}
          className="canvas-component-popover"
          role="dialog"
          aria-labelledby={titleId}
          onPointerDown={(event) => event.stopPropagation()}
          onKeyDown={(event) => event.stopPropagation()}
        >
          <header>
            <strong id={titleId}>{title}</strong>
            <IconButton
              label="Close component picker"
              size="icon-sm"
              variant="ghost"
              onClick={onClose}
            >
              <X size={14} />
            </IconButton>
          </header>
          {request.phase === 'offer' && (
            <ConnectionComponentOffer
              sourceLabel={request.sourceLabel ?? 'Component'}
              onAnswer={onAnswer}
            />
          )}
          {request.phase === 'picker' && (
            <CanvasComponentPicker connected={Boolean(request.connectionId)} onAdd={onAdd} />
          )}
        </PopoverContent>
      </CanvasFloatingAnchor>
    </Popover>
  );
}
