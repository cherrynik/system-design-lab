import type { Dispatch, RefObject, SetStateAction } from 'react';
import type { ComponentContextMenu } from '@/widgets/requirement-sidebar';

export type TransientWorkspaceUi = {
  inspectorId: string | null;
  setInspectorId: Dispatch<SetStateAction<string | null>>;
  menu: ComponentContextMenu | null;
  setMenu: Dispatch<SetStateAction<ComponentContextMenu | null>>;
  contextMenuRef: RefObject<HTMLDivElement | null>;
  closeTransientUi: () => void;
};
