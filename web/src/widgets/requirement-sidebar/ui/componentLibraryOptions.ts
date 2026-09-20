import { architectureMeta } from '@/entities/architecture';
import type { ArchitectureNodeKind, ArchitectureVariant } from '@/entities/architecture';
import type { ComponentOptionData } from './RequirementSidebar.types';

export function makeComponentOption(
  kind: ArchitectureNodeKind,
  variant: ArchitectureVariant,
  showContext = false,
): ComponentOptionData {
  const groupLabel = architectureMeta[kind].group;

  return {
    kind,
    variantId: variant.id,
    label: variant.label,
    description: variant.description,
    type: variant.type,
    context: showContext ? groupLabel : undefined,
    actionLabel: `Add ${variant.label}`,
    actionText: 'Add',
    icon: variant.icon,
  };
}
