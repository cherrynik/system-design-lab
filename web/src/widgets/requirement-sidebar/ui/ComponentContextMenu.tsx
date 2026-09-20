import { Crosshair, SlidersHorizontal, Trash2 } from 'lucide-react';
import { ContextMenu, ContextMenuContent, ContextMenuItem, DropdownMenuTrigger } from '@/shared/ui';
import type { ComponentContextMenuProps } from './RequirementSidebar.types';

export function ComponentContextMenu({
  menu,
  contextMenuRef,
  onMenuChange,
  onFocusNode,
  onInspectNode,
  onDeleteNode,
}: ComponentContextMenuProps) {
  if (!menu) return null;

  const closeAndRestoreFocus = () => {
    const triggers = document.querySelectorAll<HTMLButtonElement>('[data-component-menu-trigger]');
    const trigger = Array.from(triggers).find(
      (candidate) => candidate.dataset.componentMenuTrigger === menu.id,
    );
    onMenuChange(null);
    window.requestAnimationFrame(() => trigger?.focus());
  };

  return (
    <ContextMenu
      opened
      onChange={(open) => {
        if (!open) onMenuChange(null);
      }}
      position="bottom-start"
      width={204}
      closeOnEscape={false}
      returnFocus={false}
      withInitialFocusPlaceholder={false}
    >
      <DropdownMenuTrigger>
        <span
          aria-hidden="true"
          className="platform-floating-anchor"
          style={{ left: menu.x, top: menu.y }}
        />
      </DropdownMenuTrigger>
      <ContextMenuContent
        ref={contextMenuRef}
        className="context-menu"
        aria-label="Component actions"
        aria-labelledby=""
        onKeyDown={(event) => {
          if (event.key !== 'Escape') return;
          event.preventDefault();
          closeAndRestoreFocus();
        }}
        onPointerDown={(event) => event.stopPropagation()}
      >
        <ContextMenuItem
          autoFocus
          data-autofocus
          leftSection={<Crosshair />}
          onClick={() => {
            onFocusNode(menu.id);
            onMenuChange(null);
          }}
        >
          Focus on canvas
        </ContextMenuItem>
        <ContextMenuItem
          leftSection={<SlidersHorizontal />}
          onClick={() => {
            onInspectNode(menu.id);
            onMenuChange(null);
          }}
        >
          Inspect component
        </ContextMenuItem>
        <ContextMenuItem
          variant="destructive"
          leftSection={<Trash2 />}
          onClick={() => {
            onDeleteNode(menu.id);
            onMenuChange(null);
          }}
        >
          Delete component
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}
