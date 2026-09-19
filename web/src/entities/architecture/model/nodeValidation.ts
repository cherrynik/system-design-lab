import { getArchitectureNodeConnectionStates } from './connections';
import type { ArchitectureEdge, ArchitectureNode } from './architecture.types';
import type {
  ArchitectureNodeValidationIssue,
  ArchitectureNodeValidationState,
} from './nodeValidation.types';

export type {
  ArchitectureNodeValidationIssue,
  ArchitectureNodeValidationSeverity,
  ArchitectureNodeValidationState,
} from './nodeValidation.types';

export function validateArchitectureNodes(
  nodes: ArchitectureNode[],
  edges: ArchitectureEdge[],
): Map<string, ArchitectureNodeValidationState> {
  const components = nodes.filter((node) => !node.data.isAnchor);
  const connectionStates = getArchitectureNodeConnectionStates(nodes, edges);
  const selfConnectedNodeIds = new Set(
    edges.filter((edge) => edge.source === edge.target).map((edge) => edge.source),
  );

  return new Map(
    components.map((node) => {
      const issues: ArchitectureNodeValidationIssue[] = [];
      const connectionState = connectionStates.get(node.id);

      if (selfConnectedNodeIds.has(node.id)) {
        issues.push({
          code: 'NODE_SELF_CONNECTION',
          nodeId: node.id,
          severity: 'error',
          message: `${node.data.label} connects to itself.`,
          suggestion: 'Remove the loop or connect it to another component.',
        });
      }

      for (const direction of connectionState?.missing ?? []) {
        const incoming = direction === 'incoming';
        issues.push({
          code: incoming ? 'NODE_INPUT_REQUIRED' : 'NODE_OUTPUT_REQUIRED',
          nodeId: node.id,
          severity: 'warning',
          message: incoming
            ? `${node.data.label} has no incoming connection.`
            : `${node.data.label} has no outgoing connection.`,
          suggestion: incoming
            ? `Connect a request source to ${node.data.label}.`
            : `Connect ${node.data.label} to the next component.`,
        });
      }

      return [
        node.id,
        {
          status: issues.some((issue) => issue.severity === 'error')
            ? 'error'
            : issues.length
              ? 'warning'
              : 'valid',
          issues,
        },
      ];
    }),
  );
}

export function getArchitectureNodeValidationIssues(
  states: Map<string, ArchitectureNodeValidationState>,
) {
  return Array.from(states.values()).flatMap((state) => state.issues);
}
