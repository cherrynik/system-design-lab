import { useCallback, useEffect, useRef, useState } from 'react';
import { clampFloatingPanelPosition } from '@/shared/lib';
import type { ComponentContextMenu } from '@/widgets/requirement-sidebar';
import type { TransientWorkspaceUi } from './TransientWorkspaceUi.types';

export function useTransientWorkspaceUi(): TransientWorkspaceUi {
  const [inspectorId, setInspectorId] = useState<string | null>(null);
  const [menu, setMenu] = useState<ComponentContextMenu | null>(null);
  const contextMenuRef = useRef<HTMLDivElement | null>(null);

  const closeTransientUi = useCallback(() => {
    setMenu(null);
    setInspectorId(null);
  }, []);

  useEffect(() => {
    if (!menu) return;
    const close = () => setMenu(null);
    window.addEventListener('pointerdown', close);
    return () => window.removeEventListener('pointerdown', close);
  }, [menu]);

  useEffect(() => {
    if (!menu || !contextMenuRef.current) return;
    const panel = contextMenuRef.current.getBoundingClientRect();
    const shell = document.querySelector<HTMLElement>('.app-shell')?.getBoundingClientRect();
    const bounds = shell ?? {
      left: 0,
      top: 0,
      right: window.innerWidth,
      bottom: window.innerHeight,
    };
    const next = clampFloatingPanelPosition(
      menu,
      { width: panel.width, height: panel.height },
      bounds,
      { inset: 8 },
    );
    if (next.x !== menu.x || next.y !== menu.y) {
      setMenu((current) => {
        if (!current) return current;
        return { ...current, ...next };
      });
      return;
    }
    contextMenuRef.current.querySelector<HTMLButtonElement>('button')?.focus();
  }, [menu]);

  return {
    inspectorId,
    setInspectorId,
    menu,
    setMenu,
    contextMenuRef,
    closeTransientUi,
  };
}
