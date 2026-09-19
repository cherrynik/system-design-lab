import { Crosshair, SlidersHorizontal, Trash2 } from 'lucide-react';
import { handleComponentMenuKeyDown } from '../lib/handleComponentMenuKeyDown';
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
    <div
      ref={contextMenuRef}
      className="context-menu"
      role="menu"
      aria-label="Component actions"
      style={{ left: menu.x, top: menu.y }}
      onKeyDown={(event) => handleComponentMenuKeyDown(event, closeAndRestoreFocus)}
      onPointerDown={(event) => event.stopPropagation()}
    >
      <button
        role="menuitem"
        type="button"
        onClick={() => {
          onFocusNode(menu.id);
          onMenuChange(null);
        }}
      >
        <Crosshair />
        Focus on canvas
      </button>
      <button
        role="menuitem"
        type="button"
        onClick={() => {
          onInspectNode(menu.id);
          onMenuChange(null);
        }}
      >
        <SlidersHorizontal />
        Inspect component
      </button>
      <button
        role="menuitem"
        type="button"
        className="context-menu__danger"
        onClick={() => {
          onDeleteNode(menu.id);
          onMenuChange(null);
        }}
      >
        <Trash2 />
        Delete component
      </button>
    </div>
  );
}
