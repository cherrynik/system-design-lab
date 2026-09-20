import type { ArchitectureEdge } from '@/entities/architecture';

export function architectureArrowMeta(edge: ArchitectureEdge) {
  return {
    architectureProtocolMode: edge.data?.protocolMode ?? 'manual',
    architectureAutoProtocol: edge.data?.protocol ?? String(edge.label ?? ''),
  };
}
