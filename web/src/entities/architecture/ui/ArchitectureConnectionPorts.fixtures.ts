import type { ArchitectureEdge, ArchitectureNode } from '../model/architecture.types';

export const connectionPortNodes: ArchitectureNode[] = [
  {
    id: 'client',
    type: 'architecture',
    position: { x: 0, y: 0 },
    data: { kind: 'client', variantId: 'web-browser', label: 'Web Browser' },
  },
  {
    id: 'balancer',
    type: 'architecture',
    position: { x: 300, y: 0 },
    data: { kind: 'load-balancer', variantId: 'nginx', label: 'NGINX' },
  },
  {
    id: 'service',
    type: 'architecture',
    position: { x: 600, y: 0 },
    data: { kind: 'service', variantId: 'go-http-api', label: 'Go HTTP API' },
  },
];

export const connectionPortEdges: ArchitectureEdge[] = [
  {
    id: 'client-balancer',
    source: 'client',
    target: 'balancer',
    type: 'architecture',
    data: { protocol: 'HTTPS' },
  },
  {
    id: 'balancer-service',
    source: 'balancer',
    target: 'service',
    type: 'architecture',
    data: { protocol: 'HTTP' },
  },
];
