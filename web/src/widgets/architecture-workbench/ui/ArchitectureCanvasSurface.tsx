import { lazy, Suspense } from 'react';
import { createReferenceSolutionSnapshot } from '@/entities/architecture';
import type { TldrawArchitectureCanvasProps } from '@/features/edit-architecture-canvas';
import type { ArchitectureCanvasSurfaceProps } from './ArchitectureWorkbench.types';
import { CanvasLoadingState } from './CanvasLoadingState';

const TldrawArchitectureCanvas = lazy(() =>
  import('@/features/edit-architecture-canvas').then((module) => ({
    default: module.TldrawArchitectureCanvas,
  })),
);

export function ArchitectureCanvasSurface(props: ArchitectureCanvasSurfaceProps) {
  let snapshot = { nodes: props.nodes, edges: props.edges };
  let mode: 'interactive' | 'readonly' = 'interactive';
  let cameraId = 'my-canvas';
  let documentId = 'my-canvas';
  if (props.view === 'solutions') {
    snapshot = createReferenceSolutionSnapshot(props.solution);
    mode = 'readonly';
    cameraId = 'reference-solutions';
    documentId = `solution:${props.solution.id}`;
  }
  if (props.preview) {
    snapshot = props.preview.snapshot;
    mode = 'readonly';
    cameraId = 'validation-attempts';
    documentId = props.preview.id;
  }
  const sharedProps = {
    cameraId,
    documentId,
    nodes: snapshot.nodes,
    edges: snapshot.edges,
    validationStates: props.validationStates,
    onMountEditor: props.onMountEditor,
    autoFitOnDocumentChange: props.view === 'solutions' && !props.preview,
  };
  let canvasProps: TldrawArchitectureCanvasProps = { ...sharedProps, mode: 'readonly' };
  if (mode === 'interactive') {
    canvasProps = {
      ...sharedProps,
      mode,
      tool: props.tool,
      inspectorId: props.inspectorId,
      onNodesChange: props.onNodesChange,
      onEdgesChange: props.onEdgesChange,
      onToolChange: props.onToolChange,
      onCloseInspector: props.onCloseInspector,
      onUpdateVariant: props.onUpdateVariant,
      onNodeRenamed: props.onNodeRenamed,
      onConnectionDraft: props.onConnectionDraft,
    };
  }

  return (
    <Suspense fallback={<CanvasLoadingState />}>
      <TldrawArchitectureCanvas {...canvasProps} />
    </Suspense>
  );
}
