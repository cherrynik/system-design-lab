import { FaChrome } from 'react-icons/fa';
import { FiGitBranch, FiMonitor, FiServer } from 'react-icons/fi';
import type { IconType } from 'react-icons';
import { SiGo, SiNginx } from 'react-icons/si';
import type { ArchitectureNodeKind } from './types';

export const architectureMeta: Record<ArchitectureNodeKind, { group: string; role: string }> = {
  client: { group: 'Clients', role: 'Request Source' },
  'load-balancer': { group: 'Balancers', role: 'Traffic Router' },
  service: { group: 'Servers', role: 'Request Handler' },
};

export type ArchitectureVariant = {
  id: string;
  label: string;
  description: string;
  type: string;
  capabilities: string[];
  icon: IconType;
  concrete: boolean;
};
export const architectureVariants: Record<ArchitectureNodeKind, ArchitectureVariant[]> = {
  client: [
    {
      id: 'abstract',
      label: 'Client',
      type: 'client.generic',
      description: 'Generic request source',
      capabilities: ['http.request'],
      icon: FiMonitor,
      concrete: false,
    },
    {
      id: 'web-browser',
      label: 'Web Browser',
      type: 'client.browser',
      description: 'Browser-based HTTP client',
      capabilities: ['http.request'],
      icon: FaChrome,
      concrete: true,
    },
  ],
  'load-balancer': [
    {
      id: 'abstract',
      label: 'Load Balancer',
      type: 'traffic.generic',
      description: 'Generic traffic router',
      capabilities: ['http.forward'],
      icon: FiGitBranch,
      concrete: false,
    },
    {
      id: 'nginx',
      label: 'NGINX',
      type: 'traffic.nginx',
      description: 'Load balancer / reverse proxy',
      capabilities: ['http.forward', 'traffic.distribute'],
      icon: SiNginx,
      concrete: true,
    },
  ],
  service: [
    {
      id: 'abstract',
      label: 'Service',
      type: 'compute.generic',
      description: 'Generic request handler',
      capabilities: ['http.handle'],
      icon: FiServer,
      concrete: false,
    },
    {
      id: 'go-http-api',
      label: 'Go HTTP API',
      type: 'compute.go-api',
      description: 'Go HTTP request handler',
      capabilities: ['http.handle'],
      icon: SiGo,
      concrete: true,
    },
  ],
};

export const architectureCategoryIcons: Record<ArchitectureNodeKind, IconType> = {
  client: FiMonitor,
  'load-balancer': FiGitBranch,
  service: FiServer,
};
export const getArchitectureVariant = (kind: ArchitectureNodeKind, id?: unknown) =>
  architectureVariants[kind].find((variant) => variant.id === id) ?? architectureVariants[kind][0];
export const getConnectionProtocol = (source: ArchitectureNodeKind) =>
  source === 'client' ? 'HTTPS' : 'HTTP';
export const getArrowProtocol = (source?: ArchitectureNodeKind) =>
  source ? getConnectionProtocol(source) : '';
