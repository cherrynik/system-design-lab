import { useCallback } from 'react';
import {
  getArchitectureVariant,
  makeArchitectureNode,
  renameArchitectureNode,
  ARCHITECTURE_CARD_WIDTH,
  ARCHITECTURE_CARD_HEIGHT,
  type ArchitectureNodeKind,
} from '@/entities/architecture';
import type {
  ArchitectureNodeActions,
  ArchitectureNodeActionsOptions,
} from './ArchitectureNodeActions.types';
import type { ArchitectureNodePlacement } from '@/widgets/architecture-workbench';

export function useArchitectureNodeActions({
  nodes,
  edges,
  applyChange,
  replacePresent,
  focusShape,
  selectShape,
  setRegistryOpen,
  setGroup,
  setMenu,
  setInspectorId,
  showEvent,
}: ArchitectureNodeActionsOptions): ArchitectureNodeActions {
  const updateVariant = useCallback(
    (id: string, variantId: string) => {
      applyChange((current) => ({
        ...current,
        nodes: current.nodes.map((node) => {
          if (node.id !== id) return node;
          return { ...node, data: { ...node.data, variantId } };
        }),
      }));
      showEvent({ message: 'Component type changed', action: 'undo' });
    },
    [applyChange, showEvent],
  );

  const renameNode = useCallback(
    (id: string, label: string) => {
      const next = renameArchitectureNode(nodes, id, label);
      if (next === nodes) return;
      applyChange((current) => ({
        ...current,
        nodes: renameArchitectureNode(current.nodes, id, label),
      }));
      showEvent({ message: `Renamed to “${label.trim()}”`, action: 'undo' });
    },
    [applyChange, nodes, showEvent],
  );

  const reportCanvasRename = useCallback(
    (_id: string, label: string) => {
      showEvent({ message: `Renamed to “${label}”`, action: 'undo' });
    },
    [showEvent],
  );

  const addNode = useCallback(
    (kind: ArchitectureNodeKind, variantId = 'abstract', placement?: ArchitectureNodePlacement) => {
      if (placement?.connectionId) {
        const connection = edges.find((edge) => edge.id === placement.connectionId);
        const target = nodes.find((node) => node.id === connection?.target);
        if (!connection || !target?.data.isAnchor) return;
      }
      const kindCount =
        nodes.filter((node) => !node.data.isAnchor && node.data.kind === kind).length + 1;
      const total = nodes.filter((node) => !node.data.isAnchor).length;
      const variant = getArchitectureVariant(kind, variantId);
      const label = kindCount === 1 ? variant.label : `${variant.label} ${kindCount}`;
      const node = makeArchitectureNode(
        kind,
        variantId,
        placement ? placement.point.x - ARCHITECTURE_CARD_WIDTH / 2 : 100 + (total % 3) * 280,
        placement
          ? placement.point.y - ARCHITECTURE_CARD_HEIGHT / 2
          : 140 + Math.floor(total / 3) * 150,
        label,
      );
      applyChange((current) => {
        if (
          placement?.connectionId &&
          !current.edges.some((edge) => edge.id === placement.connectionId)
        )
          return current;
        return {
          ...current,
          nodes: [...current.nodes, node],
          edges: current.edges.map((edge) => {
            if (edge.id !== placement?.connectionId) return edge;
            return {
              ...edge,
              target: node.id,
              data: {
                ...edge.data,
                protocol: edge.data?.protocol ?? String(edge.label ?? ''),
                targetAnchor: undefined,
                targetAttachment: undefined,
              },
            };
          }),
        };
      });
      setRegistryOpen(false);
      setGroup(null);
      showEvent({ message: `Added “${node.data.label}”`, action: 'undo' });
      if (!placement) window.setTimeout(() => focusShape(node.id), 0);
    },
    [applyChange, edges, focusShape, nodes, setGroup, setRegistryOpen, showEvent],
  );

  const deleteNode = useCallback(
    (id: string) => {
      const label = nodes.find((node) => node.id === id)?.data.label ?? 'Component';
      applyChange((current) => ({
        ...current,
        nodes: current.nodes.filter((node) => node.id !== id),
        edges: current.edges.filter((edge) => edge.source !== id && edge.target !== id),
      }));
      setMenu(null);
      setInspectorId((current) => (current === id ? null : current));
      showEvent({ message: `Deleted “${label}”`, tone: 'danger', action: 'undo' });
    },
    [applyChange, nodes, setInspectorId, setMenu, showEvent],
  );

  const focusNode = useCallback(
    (id: string) => {
      replacePresent((current) => ({
        ...current,
        nodes: current.nodes.map((node) => ({ ...node, selected: node.id === id })),
      }));
      focusShape(id);
    },
    [focusShape, replacePresent],
  );

  const inspectNode = useCallback(
    (id: string) => {
      selectShape(id);
      replacePresent((current) => ({
        ...current,
        nodes: current.nodes.map((node) => ({ ...node, selected: node.id === id })),
      }));
      setInspectorId(id);
    },
    [replacePresent, selectShape, setInspectorId],
  );

  return {
    updateVariant,
    renameNode,
    reportCanvasRename,
    addNode,
    deleteNode,
    focusNode,
    inspectNode,
  };
}
