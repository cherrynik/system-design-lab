import type { ArchitectureNodeKind } from './types';

export type ReferenceSolution = {
  id: string;
  name: string;
  description: string;
  nodes: Array<{
    kind: ArchitectureNodeKind;
    variantId: string;
    label: string;
  }>;
};

export const referenceSolutions = [
  {
    id: 'direct-service',
    name: 'Direct Client → Service',
    description: 'The smallest valid request path for this requirement.',
    nodes: [
      { kind: 'client', variantId: 'web-browser', label: 'Web Browser' },
      { kind: 'service', variantId: 'go-http-api', label: 'Go HTTP API' },
    ],
  },
  {
    id: 'load-balanced',
    name: 'Load Balancer Path',
    description: 'Routes traffic through a dedicated reverse proxy.',
    nodes: [
      { kind: 'client', variantId: 'web-browser', label: 'Web Browser' },
      { kind: 'load-balancer', variantId: 'nginx', label: 'NGINX' },
      { kind: 'service', variantId: 'go-http-api', label: 'Go HTTP API' },
    ],
  },
] satisfies ReferenceSolution[];
