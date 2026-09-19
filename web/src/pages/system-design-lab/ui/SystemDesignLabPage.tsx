import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { CSSProperties, PointerEvent as ReactPointerEvent } from 'react';
import type { Editor, TLShapeId } from 'tldraw';
import {
  getArchitectureNodeConnectionStates,
  getArchitectureNodeValidationIssues,
  getArchitectureVariant,
  referenceSolutions,
  renameArchitectureNode,
  validateArchitectureNodes,
  createInitialArchitectureSnapshot,
  makeArchitectureNode,
} from '../../../entities/architecture';
import type { ArchitectureNodeKind, ArchitectureVersion } from '../../../entities/architecture';
import {
  createLocalStorageArchitectureAutosaveRepository,
  useArchitectureAutosave,
} from '../../../features/autosave-architecture';
import {
  getArchitectureHistoryShortcut,
  isEditableShortcutTarget,
  useArchitectureHistory,
} from '../../../features/canvas-history';
import { useArchitectureValidation } from '../../../features/validate-architecture';
import {
  hasUncommittedArchitectureChanges,
  useArchitectureVersions,
} from '../../../features/version-architecture';
import { clampFloatingPanelPosition } from '../../../shared/lib';
import { ArchitectureWorkbench } from '../../../widgets/architecture-workbench';
import { RequirementSidebar } from '../../../widgets/requirement-sidebar';
import { ValidationRunner } from '../../../widgets/validation-runner';

type CanvasEvent = {
  message: string;
  tone?: 'neutral' | 'danger';
  action?: 'undo' | 'redo';
  persistent?: boolean;
};

const toCanvasShapeId = (id: string) => `shape:${id}` as TLShapeId;

export function SystemDesignLabPage() {
  const autosaveRepository = useMemo(
    () => createLocalStorageArchitectureAutosaveRepository(window.localStorage),
    [],
  );
  const start = useMemo(
    () => autosaveRepository.load() ?? createInitialArchitectureSnapshot(),
    [autosaveRepository],
  );
  const {
    nodes,
    edges,
    snapshot: architectureSnapshot,
    canUndo,
    canRedo,
    applyChange,
    replacePresent,
    syncCanvasNodes,
    syncCanvasEdges,
    undo,
    redo,
  } = useArchitectureHistory(start);
  useArchitectureAutosave(architectureSnapshot, { repository: autosaveRepository });
  const {
    versions,
    latestVersion,
    commit: commitVersion,
    rename: renameVersion,
    deleteLatest: deleteLatestVersion,
    restore: restoreVersion,
  } = useArchitectureVersions();
  const {
    validationError,
    exerciseError,
    terminal,
    running: validating,
    nodeValidationVisible,
    runnerStatus,
    requirementStatus,
    validate: runValidation,
    clear: clearValidation,
  } = useArchitectureValidation();
  const [workspaceView, setWorkspaceView] = useState<'canvas' | 'solutions'>('canvas');
  const [selectedSolutionId, setSelectedSolutionId] = useState(referenceSolutions[0].id);
  const [requirementsCollapsed, setRequirementsCollapsed] = useState(false);
  const [requirementsExpanded, setRequirementsExpanded] = useState(true);
  const [layersExpanded, setLayersExpanded] = useState(true);
  const [registryOpen, setRegistryOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [group, setGroup] = useState<ArchitectureNodeKind | null>(null);
  const [groupQuery, setGroupQuery] = useState('');
  const [inspectorId, setInspectorId] = useState<string | null>(null);
  const [menu, setMenu] = useState<{ id: string; x: number; y: number } | null>(null);
  const [canvasEvent, setCanvasEvent] = useState<CanvasEvent | null>(null);
  const [versionsOpen, setVersionsOpen] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(() =>
    Math.min(380, Math.max(320, Math.round(window.innerWidth * 0.3))),
  );
  const [runnerHeight, setRunnerHeight] = useState(() =>
    Math.min(230, Math.max(180, Math.round(window.innerHeight * 0.28))),
  );
  const [resize, setResize] = useState<'sidebar' | 'runner' | null>(null);
  const [tool, setTool] = useState<'hand' | 'selection' | 'connection'>('selection');
  const terminalRef = useRef<HTMLDivElement | null>(null);
  const contextMenuRef = useRef<HTMLDivElement | null>(null);
  const workspaceRef = useRef<HTMLElement | null>(null);
  const workbenchRef = useRef<HTMLDivElement | null>(null);
  const pendingPanelSize = useRef<number | null>(null);
  const resizeFrame = useRef<number | null>(null);
  const canvasEventTimer = useRef<number | null>(null);
  const tldrawEditor = useRef<Editor | null>(null);
  const usesCommand = useMemo(() => /Macintosh|Mac OS X/.test(navigator.userAgent), []);
  const nodeConnectionStates = useMemo(
    () => getArchitectureNodeConnectionStates(nodes, edges),
    [nodes, edges],
  );
  const nodeValidationStates = useMemo(
    () => validateArchitectureNodes(nodes, edges),
    [nodes, edges],
  );
  const nodeValidationIssues = useMemo(
    () => getArchitectureNodeValidationIssues(nodeValidationStates),
    [nodeValidationStates],
  );
  const hasUncommittedChanges = useMemo(
    () => hasUncommittedArchitectureChanges({ nodes, edges }, latestVersion),
    [edges, latestVersion, nodes],
  );
  const solution = useMemo(
    () =>
      referenceSolutions.find((item) => item.id === selectedSolutionId) ?? referenceSolutions[0],
    [selectedSolutionId],
  );
  const snapshot = useCallback(() => structuredClone(architectureSnapshot), [architectureSnapshot]);
  const showCanvasEvent = useCallback((event: CanvasEvent) => {
    if (canvasEventTimer.current) window.clearTimeout(canvasEventTimer.current);
    canvasEventTimer.current = null;
    setCanvasEvent(event);
    if (!event.persistent)
      canvasEventTimer.current = window.setTimeout(() => setCanvasEvent(null), 4500);
  }, []);
  const undoArchitectureChange = useCallback(() => {
    if (!canUndo) return;
    undo();
    setMenu(null);
    setInspectorId(null);
    showCanvasEvent({
      message: 'Last change undone',
      action: 'redo',
      persistent: true,
    });
  }, [canUndo, showCanvasEvent, undo]);
  const redoArchitectureChange = useCallback(() => {
    if (!canRedo) return;
    redo();
    setMenu(null);
    setInspectorId(null);
    showCanvasEvent({ message: 'Change restored', action: 'undo' });
  }, [canRedo, redo, showCanvasEvent]);
  const updateVariant = useCallback(
    (id: string, variantId: string) => {
      applyChange((current) => ({
        ...current,
        nodes: current.nodes.map((n) =>
          n.id === id ? { ...n, data: { ...n.data, variantId } } : n,
        ),
      }));
      showCanvasEvent({ message: 'Component type changed', action: 'undo' });
    },
    [applyChange, showCanvasEvent],
  );
  const renameNode = useCallback(
    (id: string, label: string) => {
      const next = renameArchitectureNode(nodes, id, label);
      if (next === nodes) return;
      applyChange((current) => ({
        ...current,
        nodes: renameArchitectureNode(current.nodes, id, label),
      }));
      showCanvasEvent({
        message: `Renamed to “${label.trim()}”`,
        action: 'undo',
      });
    },
    [applyChange, nodes, showCanvasEvent],
  );
  const reportCanvasRename = useCallback(
    (_id: string, label: string) => {
      showCanvasEvent({ message: `Renamed to “${label}”`, action: 'undo' });
    },
    [showCanvasEvent],
  );
  const openRegistry = useCallback(() => {
    setRequirementsCollapsed(false);
    setRegistryOpen(true);
  }, []);

  useEffect(
    () => () => {
      if (canvasEventTimer.current) window.clearTimeout(canvasEventTimer.current);
    },
    [],
  );
  useEffect(() => {
    const referenced = new Set(edges.flatMap((edge) => [edge.source, edge.target]));
    if (nodes.some((node) => node.data.isAnchor && !referenced.has(node.id)))
      replacePresent((current) => ({
        ...current,
        nodes: current.nodes.filter((node) => !node.data.isAnchor || referenced.has(node.id)),
      }));
  }, [edges, nodes, replacePresent]);
  useEffect(() => {
    terminalRef.current?.scrollTo({ top: terminalRef.current.scrollHeight });
  }, [terminal, validating]);
  useEffect(() => {
    if (!menu) return;
    const close = () => setMenu(null);
    window.addEventListener('pointerdown', close);
    return () => window.removeEventListener('pointerdown', close);
  }, [menu]);
  useEffect(() => {
    if (!menu || !contextMenuRef.current) return;
    const panel = contextMenuRef.current.getBoundingClientRect();
    const next = clampFloatingPanelPosition(
      menu,
      { width: panel.width, height: panel.height },
      { left: 0, top: 0, right: window.innerWidth, bottom: window.innerHeight },
      { inset: 8 },
    );
    if (next.x !== menu.x || next.y !== menu.y)
      setMenu((current) => (current ? { ...current, ...next } : current));
    else contextMenuRef.current.querySelector<HTMLButtonElement>('button')?.focus();
  }, [menu]);
  useEffect(() => {
    if (!resize) return;
    const move = (event: PointerEvent) => {
      pendingPanelSize.current =
        resize === 'sidebar'
          ? Math.min(560, Math.max(300, event.clientX))
          : Math.min(500, Math.max(170, innerHeight - event.clientY));
      if (resizeFrame.current) return;
      resizeFrame.current = requestAnimationFrame(() => {
        resizeFrame.current = null;
        const value = pendingPanelSize.current;
        if (value === null) return;
        if (resize === 'sidebar')
          workspaceRef.current?.style.setProperty('--sidebar-width', `${value}px`);
        else workbenchRef.current?.style.setProperty('--runner-height', `${value}px`);
      });
    };
    const up = () => {
      const value = pendingPanelSize.current;
      if (value !== null) {
        if (resize === 'sidebar') setSidebarWidth(value);
        else setRunnerHeight(value);
      }
      pendingPanelSize.current = null;
      if (resizeFrame.current) cancelAnimationFrame(resizeFrame.current);
      resizeFrame.current = null;
      setResize(null);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up, { once: true });
    window.addEventListener('pointercancel', up, { once: true });
    return () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', up);
    };
  }, [resize]);
  const addNode = (kind: ArchitectureNodeKind, variantId = 'abstract') => {
    const kindCount = nodes.filter((n) => !n.data.isAnchor && n.data.kind === kind).length + 1;
    const total = nodes.filter((n) => !n.data.isAnchor).length;
    const v = getArchitectureVariant(kind, variantId);
    const node = makeArchitectureNode(
      kind,
      variantId,
      100 + (total % 3) * 280,
      140 + Math.floor(total / 3) * 150,
      kindCount === 1 ? v.label : `${v.label} ${kindCount}`,
    );
    applyChange((current) => ({ ...current, nodes: [...current.nodes, node] }));
    setRegistryOpen(false);
    setGroup(null);
    showCanvasEvent({ message: `Added “${node.data.label}”`, action: 'undo' });
    window.setTimeout(() => {
      const editor = tldrawEditor.current;
      if (!editor) return;
      const id = toCanvasShapeId(node.id),
        bounds = editor.getShapePageBounds(id);
      editor.select(id);
      if (bounds)
        editor.zoomToBounds(bounds, {
          animation: { duration: 220 },
          inset: 140,
          targetZoom: 1,
        });
    }, 0);
  };
  const deleteNode = (id: string) => {
    const label = nodes.find((node) => node.id === id)?.data.label ?? 'Component';
    applyChange((current) => ({
      ...current,
      nodes: current.nodes.filter((n) => n.id !== id),
      edges: current.edges.filter((e) => e.source !== id && e.target !== id),
    }));
    setMenu(null);
    if (inspectorId === id) setInspectorId(null);
    showCanvasEvent({
      message: `Deleted “${label}”`,
      tone: 'danger',
      action: 'undo',
    });
  };
  const focusNode = (id: string) => {
    replacePresent((current) => ({
      ...current,
      nodes: current.nodes.map((n) => ({ ...n, selected: n.id === id })),
    }));
    const editor = tldrawEditor.current;
    if (editor) {
      const shapeId = toCanvasShapeId(id),
        bounds = editor.getShapePageBounds(shapeId);
      editor.select(shapeId);
      if (bounds)
        editor.zoomToBounds(bounds, {
          animation: { duration: 220 },
          inset: 140,
          targetZoom: 1,
        });
    }
  };
  const inspectNode = (id: string) => {
    tldrawEditor.current?.select(toCanvasShapeId(id));
    replacePresent((current) => ({
      ...current,
      nodes: current.nodes.map((node) => ({
        ...node,
        selected: node.id === id,
      })),
    }));
    setInspectorId(id);
  };
  const startResize = (panel: 'sidebar' | 'runner', event: ReactPointerEvent<HTMLDivElement>) => {
    event.preventDefault();
    window.getSelection()?.removeAllRanges();
    setResize(panel);
  };
  const commitArchitecture = () => {
    const version = commitVersion(snapshot());
    setVersionsOpen(true);
    showCanvasEvent({ message: `Committed “${version.name}”` });
  };
  const renameArchitectureVersion = (versionId: string, name: string) => {
    if (renameVersion(versionId, name))
      showCanvasEvent({ message: `Renamed commit to “${name.trim()}”` });
  };
  const deleteLatestArchitectureVersion = () => {
    const latest = deleteLatestVersion();
    if (!latest) return;
    showCanvasEvent({
      message: `Deleted commit “${latest.name}”`,
      tone: 'danger',
    });
  };
  const restoreArchitectureVersion = (version: ArchitectureVersion) => {
    const restored = restoreVersion(version.id);
    if (!restored) return;
    applyChange(() => restored);
    setVersionsOpen(false);
    setWorkspaceView('canvas');
    showCanvasEvent({ message: `Restored “${version.name}”`, action: 'undo' });
    window.setTimeout(() => tldrawEditor.current?.zoomToFit({ animation: { duration: 220 } }), 0);
  };
  const validate = useCallback(
    () =>
      runValidation({
        snapshot: architectureSnapshot,
        view: workspaceView,
        solution,
        nodeValidationIssues,
      }),
    [architectureSnapshot, nodeValidationIssues, runValidation, solution, workspaceView],
  );

  useEffect(() => {
    const keys = (e: KeyboardEvent) => {
      if (isEditableShortcutTarget(e.target)) return;
      const command = e.metaKey || e.ctrlKey;
      const historyShortcut = getArchitectureHistoryShortcut(e);
      if (e.key === 'Escape') {
        setTool('selection');
        setMenu(null);
        setInspectorId(null);
        return;
      }
      if (command && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        openRegistry();
        return;
      }
      if (command && e.key === 'Enter') {
        e.preventDefault();
        void validate();
        return;
      }
      if (historyShortcut) {
        e.preventDefault();
        e.stopPropagation();
        if (historyShortcut === 'redo') redoArchitectureChange();
        else undoArchitectureChange();
        return;
      }
      if (
        workspaceView === 'canvas' &&
        (e.key === 'Backspace' || e.key === 'Delete') &&
        tldrawEditor.current?.getSelectedShapeIds().length
      ) {
        e.preventDefault();
        e.stopPropagation();
        tldrawEditor.current.deleteShapes(tldrawEditor.current.getSelectedShapeIds());
        return;
      }
      if (!e.metaKey && !e.ctrlKey && !e.altKey && ['1', '2', '3'].includes(e.key)) {
        e.preventDefault();
        setTool(e.key === '1' ? 'hand' : e.key === '2' ? 'selection' : 'connection');
      }
    };
    window.addEventListener('keydown', keys, true);
    return () => window.removeEventListener('keydown', keys, true);
  }, [openRegistry, redoArchitectureChange, undoArchitectureChange, validate, workspaceView]);
  return (
    <main className="app-shell" onContextMenu={(event) => event.preventDefault()}>
      <section
        ref={workspaceRef}
        className={`workspace ${requirementsCollapsed ? 'workspace--requirements-collapsed' : ''} ${resize ? 'workspace--resizing' : ''}`}
        style={{ '--sidebar-width': `${sidebarWidth}px` } as CSSProperties}
      >
        <RequirementSidebar
          collapsed={requirementsCollapsed}
          view={workspaceView}
          solutions={referenceSolutions}
          selectedSolutionId={selectedSolutionId}
          requirementsExpanded={requirementsExpanded}
          layersExpanded={layersExpanded}
          requirementStatus={requirementStatus}
          runnerStatus={runnerStatus}
          nodes={nodes}
          edges={edges}
          connectionStates={nodeConnectionStates}
          validationStates={nodeValidationVisible ? nodeValidationStates : undefined}
          registryOpen={registryOpen}
          query={query}
          group={group}
          groupQuery={groupQuery}
          usesCommandKey={usesCommand}
          menu={menu}
          contextMenuRef={contextMenuRef}
          onCollapsedChange={setRequirementsCollapsed}
          onViewChange={setWorkspaceView}
          onSolutionChange={setSelectedSolutionId}
          onRequirementsExpandedChange={setRequirementsExpanded}
          onLayersExpandedChange={setLayersExpanded}
          onRegistryOpenChange={(open) => {
            if (open) openRegistry();
            else setRegistryOpen(false);
          }}
          onQueryChange={setQuery}
          onGroupChange={setGroup}
          onGroupQueryChange={setGroupQuery}
          onMenuChange={setMenu}
          onAddNode={addNode}
          onFocusNode={focusNode}
          onInspectNode={inspectNode}
          onRenameNode={renameNode}
          onDeleteNode={deleteNode}
        />

        {!requirementsCollapsed && (
          <div
            className={`panel-resizer panel-resizer--vertical ${resize === 'sidebar' ? 'panel-resizer--active' : ''}`}
            role="separator"
            tabIndex={0}
            aria-label="Resize sidebar"
            aria-orientation="vertical"
            aria-valuemin={300}
            aria-valuemax={560}
            aria-valuenow={sidebarWidth}
            onPointerDown={(event) => startResize('sidebar', event)}
            onKeyDown={(event) => {
              const next =
                event.key === 'Home'
                  ? 300
                  : event.key === 'End'
                    ? 560
                    : event.key === 'ArrowLeft'
                      ? Math.max(300, sidebarWidth - 16)
                      : event.key === 'ArrowRight'
                        ? Math.min(560, sidebarWidth + 16)
                        : null;
              if (next !== null) {
                event.preventDefault();
                setSidebarWidth(next);
              }
            }}
          />
        )}

        <div
          ref={workbenchRef}
          className="workbench"
          style={{ '--runner-height': `${runnerHeight}px` } as CSSProperties}
        >
          <ArchitectureWorkbench
            view={workspaceView}
            solution={solution}
            nodes={nodes}
            edges={edges}
            tool={tool}
            inspectorId={inspectorId}
            validationStates={nodeValidationVisible ? nodeValidationStates : undefined}
            editorRef={tldrawEditor}
            versions={versions}
            versionsOpen={versionsOpen}
            dirty={hasUncommittedChanges}
            event={canvasEvent}
            onViewChange={setWorkspaceView}
            onVersionsOpenChange={setVersionsOpen}
            onCommit={commitArchitecture}
            onRestore={restoreArchitectureVersion}
            onRenameVersion={renameArchitectureVersion}
            onDeleteLatestVersion={deleteLatestArchitectureVersion}
            onNodesChange={syncCanvasNodes}
            onEdgesChange={syncCanvasEdges}
            onToolChange={setTool}
            onCloseInspector={() => setInspectorId(null)}
            onUpdateVariant={updateVariant}
            onNodeRenamed={reportCanvasRename}
            onUndo={undoArchitectureChange}
            onRedo={redoArchitectureChange}
          />

          <div
            className={`panel-resizer panel-resizer--horizontal ${resize === 'runner' ? 'panel-resizer--active' : ''}`}
            role="separator"
            tabIndex={0}
            aria-label="Resize test runner"
            aria-orientation="horizontal"
            aria-valuemin={170}
            aria-valuemax={500}
            aria-valuenow={runnerHeight}
            onPointerDown={(event) => startResize('runner', event)}
            onKeyDown={(event) => {
              const next =
                event.key === 'Home'
                  ? 170
                  : event.key === 'End'
                    ? 500
                    : event.key === 'ArrowDown'
                      ? Math.max(170, runnerHeight - 16)
                      : event.key === 'ArrowUp'
                        ? Math.min(500, runnerHeight + 16)
                        : null;
              if (next !== null) {
                event.preventDefault();
                setRunnerHeight(next);
              }
            }}
          />

          <ValidationRunner
            error={validationError ?? exerciseError}
            lines={terminal}
            running={validating}
            status={runnerStatus}
            usesCommandKey={usesCommand}
            outputRef={terminalRef}
            onClear={clearValidation}
            onValidate={() => void validate()}
          />
        </div>
      </section>
    </main>
  );
}
