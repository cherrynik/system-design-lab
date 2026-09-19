import { getArchitectureVariant } from '@/entities/architecture';
import type { ArchitectureInspectorVariantButtonProps } from '../model/architectureCanvasComponents.types';
import { useArchitectureCanvasActions } from '../model/ArchitectureCanvasActionsContext';

export function ArchitectureInspectorVariantButton({
  kind,
  nodeId,
  variantId,
  active,
}: ArchitectureInspectorVariantButtonProps) {
  const actions = useArchitectureCanvasActions();
  const variant = getArchitectureVariant(kind, variantId);
  const VariantIcon = variant.icon;
  let className = '';
  if (active) className = 'inspector-variant--active';

  return (
    <button className={className} onClick={() => actions.updateVariant(nodeId, variant.id)}>
      <VariantIcon aria-hidden="true" focusable="false" />
      <span>
        <strong>{variant.label}</strong>
        <small>{variant.description}</small>
      </span>
    </button>
  );
}
