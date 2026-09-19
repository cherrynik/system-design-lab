import { Search } from 'lucide-react';
import { architectureMeta, architectureVariants } from '@/entities/architecture';
import type { ArchitectureNodeKind } from '@/entities/architecture';
import { ComponentOption } from './ComponentOption';
import type { ComponentOptionData, ComponentSearchResultsProps } from './RequirementSidebar.types';

export function ComponentSearchResults({ query, onAddNode }: ComponentSearchResultsProps) {
  const normalizedQuery = query.trim().toLowerCase();
  const results = (Object.keys(architectureVariants) as ArchitectureNodeKind[]).flatMap((kind) =>
    architectureVariants[kind]
      .filter((variant) =>
        `${variant.label} ${variant.description} ${variant.type}`
          .toLowerCase()
          .includes(normalizedQuery),
      )
      .map<ComponentOptionData>((variant) => ({
        kind,
        variantId: variant.id,
        label: variant.label,
        description: variant.description,
        meta: architectureMeta[kind].group,
        icon: variant.icon,
      })),
  );

  if (!results.length) {
    return (
      <div className="component-library__empty">
        <Search aria-hidden="true" focusable="false" />
        <strong>No components found</strong>
        <small>Try another name or browse a category.</small>
      </div>
    );
  }

  return (
    <div className="component-picker search-results">
      {results.map((option) => (
        <ComponentOption
          key={`${option.kind}-${option.variantId}`}
          option={option}
          onAdd={(selected) => onAddNode(selected.kind, selected.variantId)}
        />
      ))}
    </div>
  );
}
