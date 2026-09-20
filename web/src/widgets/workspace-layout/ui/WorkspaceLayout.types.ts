import type { ReactNode } from 'react';

export type WorkspaceLayoutProps = {
  sidebar: ReactNode;
  canvas: ReactNode;
  runner: ReactNode;
  sidebarCollapsed: boolean;
};

export type WorkspaceResizeHandleProps = {
  id: string;
  label: string;
};
