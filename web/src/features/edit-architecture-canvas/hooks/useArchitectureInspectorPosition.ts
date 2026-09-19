import { useEditor, useValue } from 'tldraw';
import { clampFloatingPanelPosition } from '@/shared/lib';
import { INSPECTOR_GAP, INSPECTOR_VIEWPORT_MARGIN, INSPECTOR_WIDTH } from '../model/constants';
import type {
  ArchitectureCardShape,
  ArchitectureInspectorPlacement,
  ArchitectureInspectorState,
} from '../model/architectureCanvas.types';
import { shapeIdForNode } from '../lib/shapeIds';

function resolvePlacement(
  availableAbove: number,
  availableBelow: number,
  inspectorHeight: number,
): ArchitectureInspectorPlacement {
  if (availableAbove >= inspectorHeight || availableAbove >= availableBelow) return 'above';
  return 'below';
}

export function useArchitectureInspectorPosition(
  inspectorId: string | null,
  inspectorHeight: number,
): ArchitectureInspectorState | null {
  const editor = useEditor();
  return useValue(
    'architecture inspector overlay',
    () => {
      if (!inspectorId) return null;
      editor.getCamera();
      const viewport = editor.getViewportScreenBounds();
      const shape = editor.getShape<ArchitectureCardShape>(shapeIdForNode(inspectorId));
      const bounds = shape ? editor.getShapePageBounds(shape.id) : undefined;
      if (!shape || !bounds) return null;
      const topAnchor = editor.pageToViewport({ x: bounds.midX, y: bounds.minY });
      const bottomAnchor = editor.pageToViewport({ x: bounds.midX, y: bounds.maxY });
      const availableAbove = topAnchor.y - INSPECTOR_GAP - INSPECTOR_VIEWPORT_MARGIN;
      const availableBelow =
        viewport.h - bottomAnchor.y - INSPECTOR_GAP - INSPECTOR_VIEWPORT_MARGIN;
      const placement = resolvePlacement(availableAbove, availableBelow, inspectorHeight);
      let panelY = bottomAnchor.y + INSPECTOR_GAP;
      if (placement === 'above') panelY = topAnchor.y - INSPECTOR_GAP - inspectorHeight;
      const position = clampFloatingPanelPosition(
        { x: topAnchor.x - INSPECTOR_WIDTH / 2, y: panelY },
        { width: INSPECTOR_WIDTH, height: inspectorHeight },
        { left: 0, top: 0, right: viewport.w, bottom: viewport.h },
        { inset: INSPECTOR_VIEWPORT_MARGIN },
      );
      let anchorY = position.y;
      if (placement === 'above') anchorY += inspectorHeight;
      return {
        shape,
        x: position.x + INSPECTOR_WIDTH / 2,
        y: anchorY,
        placement,
      };
    },
    [editor, inspectorId, inspectorHeight],
  );
}
