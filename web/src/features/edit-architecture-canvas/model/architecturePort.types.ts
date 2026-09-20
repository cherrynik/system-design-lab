import type { TLBinding } from 'tldraw';
import type { EdgeAnchor } from '@/entities/architecture';

declare module 'tldraw' {
  interface TLGlobalBindingPropsMap {
    'architecture-port': { anchor: EdgeAnchor; originalAnchor?: EdgeAnchor | null };
  }
}

export type ArchitecturePortBinding = TLBinding<'architecture-port'>;
