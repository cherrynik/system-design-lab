import { useMemo } from 'react';
import { createInitialArchitectureSnapshot, referenceSolutions } from '@/entities/architecture';
import {
  createLocalStorageArchitectureAutosaveRepository,
  useArchitectureAutosave,
} from '@/features/autosave-architecture';
import { useArchitectureHistory } from '@/features/canvas-history';
import { useArchitectureValidation } from '@/features/validate-architecture';
import { useArchitectureVersions } from '@/features/version-architecture';
import type { RequirementSidebarProps } from '@/widgets/requirement-sidebar';
import type { SystemDesignLabController } from './SystemDesignLabController.types';
import { useArchitectureDerivedState } from './useArchitectureDerivedState';
import { useArchitectureEditorController } from './useArchitectureEditorController';
import { useArchitectureHistoryActions } from './useArchitectureHistoryActions';
import { useArchitectureNodeActions } from './useArchitectureNodeActions';
import { useArchitectureValidationController } from './useArchitectureValidationController';
import { useArchitectureValidationInvalidation } from './useArchitectureValidationInvalidation';
import { useArchitectureVersionActions } from './useArchitectureVersionActions';
import { useCanvasEvents } from './useCanvasEvents';
import { useOrphanAnchorCleanup } from './useOrphanAnchorCleanup';
import { useTransientWorkspaceUi } from './useTransientWorkspaceUi';
import { useWorkspaceShortcuts } from './useWorkspaceShortcuts';
import { useWorkspaceUiState } from './useWorkspaceUiState';

export function useSystemDesignLabController(): SystemDesignLabController {
  const autosaveRepository = useMemo(
    () => createLocalStorageArchitectureAutosaveRepository(window.localStorage),
    [],
  );
  const initialSnapshot = useMemo(
    () => autosaveRepository.load() ?? createInitialArchitectureSnapshot(),
    [autosaveRepository],
  );
  const history = useArchitectureHistory(initialSnapshot);
  useArchitectureAutosave(history.snapshot, { repository: autosaveRepository });

  const versioning = useArchitectureVersions();
  const validation = useArchitectureValidation();
  const workspace = useWorkspaceUiState();
  const transientUi = useTransientWorkspaceUi();
  const editor = useArchitectureEditorController();
  const canvasEvents = useCanvasEvents();
  const usesCommandKey = useMemo(() => /Macintosh|Mac OS X/.test(window.navigator.userAgent), []);

  const derived = useArchitectureDerivedState({
    nodes: history.nodes,
    edges: history.edges,
    latestVersion: versioning.latestVersion,
    selectedSolutionId: workspace.selectedSolutionId,
    nodeValidationVisible: validation.nodeValidationVisible,
  });

  useArchitectureValidationInvalidation({
    snapshot: history.snapshot,
    view: workspace.workspaceView,
    solution: derived.selectedSolution,
    invalidateValidation: validation.clear,
  });

  const validationController = useArchitectureValidationController({
    snapshot: history.snapshot,
    workspaceView: workspace.workspaceView,
    selectedSolution: derived.selectedSolution,
    nodeValidationIssues: derived.nodeValidationIssues,
    validateArchitecture: validation.validate,
    running: validation.running,
    terminal: validation.terminal,
  });

  const historyActions = useArchitectureHistoryActions({
    canUndo: history.canUndo,
    canRedo: history.canRedo,
    undo: history.undo,
    redo: history.redo,
    closeTransientUi: transientUi.closeTransientUi,
    showEvent: canvasEvents.show,
  });

  const nodeActions = useArchitectureNodeActions({
    nodes: history.nodes,
    applyChange: history.applyChange,
    replacePresent: history.replacePresent,
    focusShape: editor.focusShape,
    selectShape: editor.selectShape,
    setRegistryOpen: workspace.setRegistryOpen,
    setGroup: workspace.setGroup,
    setMenu: transientUi.setMenu,
    setInspectorId: transientUi.setInspectorId,
    showEvent: canvasEvents.show,
  });

  const versionActions = useArchitectureVersionActions({
    snapshot: history.snapshot,
    applyChange: history.applyChange,
    commitVersion: versioning.commit,
    renameVersion: versioning.rename,
    deleteLatestVersion: versioning.deleteLatest,
    restoreVersion: versioning.restore,
    setVersionsOpen: workspace.setVersionsOpen,
    setWorkspaceView: workspace.setWorkspaceView,
    showEvent: canvasEvents.show,
    zoomToFit: editor.zoomToFit,
  });

  useOrphanAnchorCleanup({
    nodes: history.nodes,
    edges: history.edges,
    replacePresent: history.replacePresent,
  });

  const shortcutOptions = useMemo(
    () => ({
      workspaceView: workspace.workspaceView,
      setTool: workspace.setTool,
      closeTransientUi: transientUi.closeTransientUi,
      openRegistry: workspace.openRegistry,
      validate: validationController.validate,
      undo: historyActions.undoArchitectureChange,
      redo: historyActions.redoArchitectureChange,
      deleteSelectedShapes: editor.deleteSelectedShapes,
      hasSelectedShapes: editor.hasSelectedShapes,
    }),
    [
      editor.deleteSelectedShapes,
      editor.hasSelectedShapes,
      historyActions.redoArchitectureChange,
      historyActions.undoArchitectureChange,
      transientUi.closeTransientUi,
      validationController.validate,
      workspace.openRegistry,
      workspace.setTool,
      workspace.workspaceView,
    ],
  );
  useWorkspaceShortcuts(shortcutOptions);

  const sidebarProps: RequirementSidebarProps = {
    collapsed: workspace.requirementsCollapsed,
    view: workspace.workspaceView,
    solutions: referenceSolutions,
    selectedSolutionId: workspace.selectedSolutionId,
    requirementsExpanded: workspace.requirementsExpanded,
    layersExpanded: workspace.layersExpanded,
    requirementStatus: validation.requirementStatus,
    runnerStatus: validation.runnerStatus,
    nodes: history.nodes,
    edges: history.edges,
    connectionStates: derived.nodeConnectionStates,
    validationStates: derived.visibleValidationStates,
    registryOpen: workspace.registryOpen,
    query: workspace.query,
    group: workspace.group,
    usesCommandKey,
    menu: transientUi.menu,
    contextMenuRef: transientUi.contextMenuRef,
    onCollapsedChange: workspace.setRequirementsCollapsed,
    onViewChange: workspace.setWorkspaceView,
    onSolutionChange: workspace.setSelectedSolutionId,
    onRequirementsExpandedChange: workspace.setRequirementsExpanded,
    onLayersExpandedChange: workspace.setLayersExpanded,
    onRegistryOpenChange: workspace.handleRegistryOpenChange,
    onQueryChange: workspace.setQuery,
    onGroupChange: workspace.setGroup,
    onMenuChange: transientUi.setMenu,
    onAddNode: nodeActions.addNode,
    onFocusNode: nodeActions.focusNode,
    onInspectNode: nodeActions.inspectNode,
    onRenameNode: nodeActions.renameNode,
    onDeleteNode: nodeActions.deleteNode,
  };

  return {
    sidebarCollapsed: workspace.requirementsCollapsed,
    sidebarProps,
    workbenchProps: {
      view: workspace.workspaceView,
      solution: derived.selectedSolution,
      nodes: history.nodes,
      edges: history.edges,
      tool: workspace.tool,
      inspectorId: transientUi.inspectorId,
      validationStates: derived.visibleValidationStates,
      editorRef: editor.editorRef,
      onMountEditor: editor.mountEditor,
      versions: versioning.versions,
      versionsOpen: workspace.versionsOpen,
      dirty: derived.hasUncommittedChanges,
      event: canvasEvents.event,
      onViewChange: workspace.setWorkspaceView,
      onVersionsOpenChange: workspace.setVersionsOpen,
      onCommit: versionActions.commitArchitecture,
      onRestore: versionActions.restoreArchitectureVersion,
      onRenameVersion: versionActions.renameArchitectureVersion,
      onDeleteLatestVersion: versionActions.deleteLatestArchitectureVersion,
      onNodesChange: history.syncCanvasNodes,
      onEdgesChange: history.syncCanvasEdges,
      onToolChange: workspace.setTool,
      onCloseInspector: () => transientUi.setInspectorId(null),
      onUpdateVariant: nodeActions.updateVariant,
      onNodeRenamed: nodeActions.reportCanvasRename,
      onUndo: historyActions.undoArchitectureChange,
      onRedo: historyActions.redoArchitectureChange,
    },
    runnerProps: {
      error: validation.validationError ?? validation.exerciseError,
      lines: validation.terminal,
      running: validation.running,
      status: validation.runnerStatus,
      usesCommandKey,
      outputRef: validationController.terminalRef,
      onClear: validation.clear,
      onValidate: () => void validationController.validate(),
    },
  };
}
