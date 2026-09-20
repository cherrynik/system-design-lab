import type { TLArrowBindingProps } from 'tldraw';
import type { ArchitectureAttachment, EdgeAnchor } from '@/entities/architecture';
import { normalizedAnchor } from './anchors';

/** Restore native attachments verbatim; old externally pinned ports become automatic native bindings. */
export function architectureArrowBindingProps(
  terminal: 'start' | 'end',
  anchor?: EdgeAnchor,
  attachment?: ArchitectureAttachment,
): TLArrowBindingProps {
  if (attachment) return { terminal, ...attachment };
  let legacyAnchor = anchor;
  if (legacyAnchor?.gap !== undefined) legacyAnchor = undefined;
  return {
    terminal,
    normalizedAnchor: normalizedAnchor(legacyAnchor),
    isPrecise: Boolean(legacyAnchor),
    isExact: false,
    snap: 'none',
  };
}
