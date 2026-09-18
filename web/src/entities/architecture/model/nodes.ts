import type { ArchitectureNode } from './types';

export const normalizeComponentLabel = (label: string) => label.trim();

export function renameArchitectureNode(nodes: ArchitectureNode[], nodeId: string, label: string): ArchitectureNode[] {
  const nextLabel = normalizeComponentLabel(label);
  if (!nextLabel) return nodes;

  const target = nodes.find((node) => node.id === nodeId);
  if (!target || target.data.label === nextLabel) return nodes;

  return nodes.map((node) => node.id === nodeId
    ? { ...node, data: { ...node.data, label: nextLabel } }
    : node);
}
