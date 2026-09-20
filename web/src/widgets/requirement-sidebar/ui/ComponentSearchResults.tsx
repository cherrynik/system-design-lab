import { Search } from 'lucide-react';
import { architectureVariants } from '@/entities/architecture';
import type { ArchitectureNodeKind } from '@/entities/architecture';
import { ComponentOption } from './ComponentOption';
import { makeComponentOption } from './componentLibraryOptions';
import type { ComponentSearchResultsProps } from './RequirementSidebar.types';

export function ComponentSearchResults({ query, onAddNode }: ComponentSearchResultsProps) {
  const normalizedQuery = query.trim().toLowerCase();
  const results = (Object.keys(architectureVariants) as ArchitectureNodeKind[]).flatMap((kind) =>
    architectureVariants[kind]
      .filter(
        (variant) =>
          variant.concrete &&
          `${variant.label} ${variant.description} ${variant.type} ${variant.capabilities.join(' ')}`
            .toLowerCase()
            .includes(normalizedQuery),
      )
      .map((variant) => makeComponentOption(kind, variant, true)),
  );
  let content = (
    <div className="component-search-results__list">
      {results.map((option) => (
        <ComponentOption
          key={`${option.kind}-${option.variantId}`}
          option={option}
          onAdd={(selected) => onAddNode(selected.kind, selected.variantId)}
        />
      ))}
    </div>
  );

  if (!results.length) {
    content = (
      <div className="component-library-empty">
        <Search aria-hidden="true" focusable="false" />
        <strong>No matching components</strong>
        <small>Search by name, role, type, or capability.</small>
      </div>
    );
  }

  const countLabel = results.length === 1 ? '1 result' : `${results.length} results`;

  return (
    <div className="component-search-results">
      <header className="component-search-results__header">
        <div>
          <h2>Search results</h2>
          <p>
            Matching <strong>“{query.trim()}”</strong>
          </p>
        </div>
        <span>{countLabel}</span>
      </header>
      {content}
    </div>
  );
}
