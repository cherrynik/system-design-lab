import { useCallback, useRef, useState } from 'react';
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

  return {
    inspectorId,
    setInspectorId,
    menu,
    setMenu,
    contextMenuRef,
    closeTransientUi,
  };
}
