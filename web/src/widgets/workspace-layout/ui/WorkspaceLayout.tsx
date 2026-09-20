import { useEffect } from 'react';
import { useMediaQuery } from '@mantine/hooks';
import { Group, Panel, usePanelRef } from 'react-resizable-panels';
import type { Orientation } from 'react-resizable-panels';
import { cn } from '@/shared/lib';
import type { WorkspaceLayoutProps } from './WorkspaceLayout.types';
import { WorkspaceResizeHandle } from './WorkspaceResizeHandle';
import './WorkspaceLayout.css';

export function WorkspaceLayout({
  sidebar,
  canvas,
  runner,
  sidebarCollapsed,
}: WorkspaceLayoutProps) {
  const compact = useMediaQuery('(max-width: 780px) and (orientation: portrait)') === true;
  const tightHeight = useMediaQuery('(max-height: 640px)') === true;
  const outerOrientation: Orientation = compact ? 'vertical' : 'horizontal';
  let sidebarDefaultSize = compact ? '36%' : '340px';
  let sidebarMinSize = compact ? '180px' : '280px';
  let sidebarMaxSize = compact ? '55%' : '520px';
  let canvasMinSize = '260px';
  let runnerDefaultSize = '210px';
  let runnerMinSize = '148px';
  let runnerMaxSize = '46%';
  if (!compact && tightHeight) {
    sidebarDefaultSize = '260px';
    sidebarMinSize = '220px';
    sidebarMaxSize = '45%';
  }
  if (tightHeight) {
    canvasMinSize = '160px';
    runnerDefaultSize = '96px';
    runnerMinSize = '48px';
    runnerMaxSize = '40%';
  }
  let resolvedSidebarDefaultSize = sidebarDefaultSize;
  let resolvedSidebarMinSize = sidebarMinSize;
  let resolvedSidebarMaxSize = sidebarMaxSize;
  if (sidebarCollapsed) {
    resolvedSidebarDefaultSize = '48px';
    resolvedSidebarMinSize = '48px';
    resolvedSidebarMaxSize = '48px';
  }
  const sidebarPanelRef = usePanelRef();

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      const panel = sidebarPanelRef.current;
      if (!panel) return;

      if (sidebarCollapsed) {
        panel.resize('48px');
        return;
      }

      if (panel.getSize().inPixels < 300) panel.resize(sidebarDefaultSize);
    });

    return () => window.cancelAnimationFrame(frame);
  }, [sidebarCollapsed, sidebarDefaultSize, sidebarPanelRef]);

  return (
    <Group
      className="workspace-layout"
      id={`platform-workspace-${outerOrientation}`}
      orientation={outerOrientation}
      resizeTargetMinimumSize={{ fine: 10, coarse: 28 }}
    >
      <Panel
        id="requirements-panel"
        className={cn(
          'workspace-layout__sidebar',
          sidebarCollapsed && 'workspace-layout__sidebar--collapsed',
        )}
        defaultSize={resolvedSidebarDefaultSize}
        minSize={resolvedSidebarMinSize}
        maxSize={resolvedSidebarMaxSize}
        disabled={sidebarCollapsed}
        groupResizeBehavior="preserve-pixel-size"
        panelRef={sidebarPanelRef}
      >
        {sidebar}
      </Panel>

      {!sidebarCollapsed && <WorkspaceResizeHandle id="sidebar-separator" label="Resize sidebar" />}

      <Panel id="workbench-panel" className="workspace-layout__workbench" minSize="35%">
        <Group
          className="workspace-layout__workbench-group workbench"
          id="platform-workbench"
          orientation="vertical"
          resizeTargetMinimumSize={{ fine: 10, coarse: 28 }}
        >
          <Panel id="canvas-panel" minSize={canvasMinSize}>
            {canvas}
          </Panel>
          <WorkspaceResizeHandle id="runner-separator" label="Resize test runner" />
          <Panel
            id="runner-panel"
            className="workspace-layout__runner"
            defaultSize={runnerDefaultSize}
            minSize={runnerMinSize}
            maxSize={runnerMaxSize}
            collapsible
            collapsedSize="48px"
            groupResizeBehavior="preserve-pixel-size"
          >
            {runner}
          </Panel>
        </Group>
      </Panel>
    </Group>
  );
}
