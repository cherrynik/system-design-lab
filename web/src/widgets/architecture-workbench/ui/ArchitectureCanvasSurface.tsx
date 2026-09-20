import { lazy, Suspense } from 'react';
import { createReferenceSolutionSnapshot } from '@/entities/architecture';
import type { ArchitectureCanvasSurfaceProps } from './ArchitectureWorkbench.types';
import { CanvasLoadingState } from './CanvasLoadingState';

const TldrawArchitectureCanvas = lazy(() =>
  import('@/features/edit-architecture-canvas').then((module) => ({
    default: module.TldrawArchitectureCanvas,
  })),
);

export function ArchitectureCanvasSurface(props: ArchitectureCanvasSurfaceProps) {
  if (props.view === 'solutions') {
    const snapshot = createReferenceSolutionSnapshot(props.solution);
    return (
      <Suspense fallback={<CanvasLoadingState />}>
        <TldrawArchitectureCanvas
          key="reference-solutions"
          mode="readonly"
          documentId={`solution:${props.solution.id}`}
          nodes={snapshot.nodes}
          edges={snapshot.edges}
          validationStates={props.validationStates}
          onMountEditor={props.onMountEditor}
        />
      </Suspense>
    );
  }

  return (
    <Suspense fallback={<CanvasLoadingState />}>
      <TldrawArchitectureCanvas
        key="my-canvas"
        mode="interactive"
        documentId="my-canvas"
        nodes={props.nodes}
        edges={props.edges}
        tool={props.tool}
        inspectorId={props.inspectorId}
        validationStates={props.validationStates}
        onNodesChange={props.onNodesChange}
        onEdgesChange={props.onEdgesChange}
        onMountEditor={props.onMountEditor}
        onToolChange={props.onToolChange}
        onCloseInspector={props.onCloseInspector}
        onUpdateVariant={props.onUpdateVariant}
        onNodeRenamed={props.onNodeRenamed}
      />
    </Suspense>
  );
}
