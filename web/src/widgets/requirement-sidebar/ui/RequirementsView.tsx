import { ArchitectureSidebarGraph } from '@/entities/architecture';
import { ComponentContextMenu } from './ComponentContextMenu';
import { ComponentRegistryDialog } from './ComponentRegistryDialog';
import { RequirementDocument } from './RequirementDocument';
import { RequirementSection } from './RequirementSection';
import type { RequirementsViewProps } from './RequirementSidebar.types';

export function RequirementsView({
  requirementsExpanded,
  layersExpanded,
  requirementStatus,
  runnerStatus,
  nodes,
  edges,
  connectionStates,
  validationStates,
  registryOpen,
  query,
  group,
  groupQuery,
  usesCommandKey,
  menu,
  contextMenuRef,
  onRequirementsExpandedChange,
  onLayersExpandedChange,
  onRegistryOpenChange,
  onQueryChange,
  onGroupChange,
  onGroupQueryChange,
  onMenuChange,
  onAddNode,
  onFocusNode,
  onInspectNode,
  onRenameNode,
  onDeleteNode,
}: RequirementsViewProps) {
  return (
    <>
      <RequirementSection
        expanded={requirementsExpanded}
        requirementStatus={requirementStatus}
        runnerStatus={runnerStatus}
        onExpandedChange={onRequirementsExpandedChange}
      >
        <RequirementDocument />
      </RequirementSection>
      <section className="sidebar-section layers" aria-label="Architecture components">
        <ArchitectureSidebarGraph
          nodes={nodes}
          edges={edges}
          connectionStates={connectionStates}
          validationStates={validationStates}
          expanded={layersExpanded}
          onToggleExpanded={() => onLayersExpandedChange(!layersExpanded)}
          onAddComponent={() => onRegistryOpenChange(true)}
          onFocus={onFocusNode}
          onRename={onRenameNode}
          onOpenMenu={(id, x, y) => onMenuChange({ id, x, y })}
        />
      </section>
      <ComponentRegistryDialog
        registryOpen={registryOpen}
        query={query}
        group={group}
        groupQuery={groupQuery}
        usesCommandKey={usesCommandKey}
        onRegistryOpenChange={onRegistryOpenChange}
        onQueryChange={onQueryChange}
        onGroupChange={onGroupChange}
        onGroupQueryChange={onGroupQueryChange}
        onAddNode={onAddNode}
      />
      <ComponentContextMenu
        menu={menu}
        contextMenuRef={contextMenuRef}
        onMenuChange={onMenuChange}
        onFocusNode={onFocusNode}
        onInspectNode={onInspectNode}
        onDeleteNode={onDeleteNode}
      />
    </>
  );
}
