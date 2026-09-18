import type { Edge, Node } from '@xyflow/react';
import type { ArchitectureNodeKind, Exercise, ValidationResult } from './types';

interface ArchitectureNodeData extends Record<string, unknown> {
  label: string;
  kind: ArchitectureNodeKind;
}

export type ArchitectureNode = Node<ArchitectureNodeData>;

export function toArchitecturePayload(nodes: ArchitectureNode[], edges: Edge[]) {
  return {
    nodes: nodes.map((node) => ({ id: node.id, kind: node.data.kind })),
    edges: edges.map((edge) => ({ from: edge.source, to: edge.target })),
  };
}

export async function fetchExercise(): Promise<Exercise> {
  const response = await fetch('/api/exercise');
  if (!response.ok) throw new Error('Could not load the exercise.');
  return response.json() as Promise<Exercise>;
}

export async function evaluateArchitecture(
  nodes: ArchitectureNode[],
  edges: Edge[],
): Promise<ValidationResult[]> {
  const response = await fetch('/api/evaluate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(toArchitecturePayload(nodes, edges)),
  });

  if (!response.ok) throw new Error('The architecture could not be evaluated.');
  const payload = (await response.json()) as { results: ValidationResult[] };
  return payload.results;
}
