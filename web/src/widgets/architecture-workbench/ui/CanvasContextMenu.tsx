import { useState } from 'react';
import { useQuickReactor } from 'tldraw';
import { Crosshair, Plus, SlidersHorizontal, Trash2 } from 'lucide-react';
import {
  ContextMenu,
  DropdownMenuTrigger,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuCheckboxItem,
  ContextMenuSeparator,
} from '@/shared/ui';
import { CanvasFloatingAnchor } from './CanvasFloatingAnchor';
import type { CanvasOverlayAnchor } from '../model/canvasOverlayAnchor.types';
import type { CanvasContextMenuProps, CanvasMenuTarget } from './CanvasContextMenu.types';

export function CanvasContextMenu({
  children,
  enabled,
  editorRef,
  preference,
  onPreferenceChange,
  onAdd,
  onInspectNode,
  onFocusNode,
  onDeleteNode,
}: CanvasContextMenuProps) {
  const [open, setOpen] = useState(false);
  const [previousEnabled, setPreviousEnabled] = useState(enabled);
  if (previousEnabled !== enabled) {
    setPreviousEnabled(enabled);
    setOpen(false);
  }
  const [target, setTarget] = useState<CanvasMenuTarget>({
    anchor: { type: 'screen', point: { x: 0, y: 0 } },
  });
  const nodeId = target.nodeId;
  const shapeId = target.shapeId;
  useQuickReactor(
    'dismiss deleted canvas context target',
    () => {
      if (!open || !shapeId) return;
      if (!editorRef.current?.getShape(shapeId)) setOpen(false);
    },
    [editorRef, open, shapeId],
  );
  return (
    <ContextMenu
      opened={open && enabled}
      onChange={(value) => setOpen(value && enabled)}
      width={216}
      zIndex={190}
      withinPortal={false}
      floatingStrategy="absolute"
      position="bottom-start"
      offset={8}
    >
      <div
        className="canvas-menu-surface"
        onContextMenuCapture={(event) => {
          if (
            !enabled ||
            (event.target as HTMLElement).closest(
              '.canvas-toolbar, .canvas-navigation-controls, .canvas-add-button',
            )
          ) {
            event.preventDefault();
            event.stopPropagation();
            return;
          }
          const editor = editorRef.current;
          const screen = { x: event.clientX, y: event.clientY };
          const shape = editor?.getShapeAtPoint(editor.screenToPage(screen));
          let clickedNodeId: string | undefined;
          if (shape?.type === 'architecture-card') clickedNodeId = shape.props.nodeId;
          let anchor: CanvasOverlayAnchor = { type: 'screen', point: screen };
          if (editor) {
            const pagePoint = editor.screenToPage(screen);
            anchor = { type: 'page', point: pagePoint };
            if (shape) {
              anchor = {
                type: 'shape',
                shapeId: shape.id,
                point: editor.getPointInShapeSpace(shape, pagePoint),
              };
            }
          }
          setTarget({ anchor, shapeId: shape?.id, nodeId: clickedNodeId });
          event.preventDefault();
          event.stopPropagation();
          setOpen(true);
        }}
        onDoubleClickCapture={(event) => {
          const editor = editorRef.current;
          if (!enabled || !editor || editor.getCurrentToolId() !== 'select') return;
          const point = { x: event.clientX, y: event.clientY };
          if (editor.getShapeAtPoint(editor.screenToPage(point))) return;
          if (
            (event.target as HTMLElement).closest(
              'button, input, [role="dialog"], [data-canvas-overlay]',
            )
          )
            return;
          event.preventDefault();
          event.stopPropagation();
          onAdd({ type: 'page', point: editor.screenToPage(point) });
        }}
      >
        {children}
      </div>
      <CanvasFloatingAnchor editorRef={editorRef} anchor={target.anchor} zIndex={190}>
        <DropdownMenuTrigger>
          <span aria-hidden="true" className="canvas-component-popover__anchor" />
        </DropdownMenuTrigger>
        <ContextMenuContent aria-label="Canvas actions" aria-labelledby="">
          <ContextMenuItem leftSection={<Plus size={14} />} onClick={() => onAdd(target.anchor)}>
            Add component
          </ContextMenuItem>
          {nodeId && (
            <ContextMenuItem
              leftSection={<SlidersHorizontal size={14} />}
              onClick={() => onInspectNode?.(nodeId)}
            >
              Inspect component
            </ContextMenuItem>
          )}
          {nodeId && (
            <ContextMenuItem
              leftSection={<Crosshair size={14} />}
              onClick={() => onFocusNode?.(nodeId)}
            >
              Focus on canvas
            </ContextMenuItem>
          )}
          {shapeId && (
            <ContextMenuItem
              variant="destructive"
              leftSection={<Trash2 size={14} />}
              onClick={() => {
                if (nodeId) onDeleteNode?.(nodeId);
                else editorRef.current?.deleteShapes([shapeId]);
              }}
            >
              Delete
            </ContextMenuItem>
          )}
          <ContextMenuSeparator />
          <ContextMenuCheckboxItem
            checked={preference !== 'never'}
            onChange={(checked) => {
              if (checked) onPreferenceChange('ask');
              else onPreferenceChange('never');
            }}
          >
            Suggest next component
          </ContextMenuCheckboxItem>
        </ContextMenuContent>
      </CanvasFloatingAnchor>
    </ContextMenu>
  );
}
