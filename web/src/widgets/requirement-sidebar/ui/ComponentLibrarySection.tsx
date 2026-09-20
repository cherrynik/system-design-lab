import { Plus } from 'lucide-react';
import {
  architectureCategoryIcons,
  architectureMeta,
  architectureVariants,
} from '@/entities/architecture';
import { ComponentOption } from './ComponentOption';
import { makeComponentOption } from './componentLibraryOptions';
import type { ComponentLibrarySectionProps } from './RequirementSidebar.types';

export function ComponentLibrarySection({ kind, onAddNode }: ComponentLibrarySectionProps) {
  const CategoryIcon = architectureCategoryIcons[kind];
  const category = architectureMeta[kind];
  const variants = architectureVariants[kind];
  const abstractVariant = variants.find((variant) => !variant.concrete);
  const options = variants
    .filter((variant) => variant.concrete)
    .map((variant) => makeComponentOption(kind, variant));
  const componentCount =
    options.length === 1 ? '1 implementation' : `${options.length} implementations`;
  let quickAdd = null;

  if (abstractVariant) {
    quickAdd = (
      <button
        className="component-library-section__quick-add"
        type="button"
        onClick={() => onAddNode(kind)}
        aria-label={`Quick add ${category.group}`}
      >
        <Plus aria-hidden="true" focusable="false" />
        <span>Quick add {abstractVariant.label}</span>
      </button>
    );
  }

  return (
    <section className="component-library-section" aria-labelledby={`catalog-${kind}`}>
      <header className="component-library-section__header">
        <CategoryIcon
          className={`component-library-section__icon component-logo--${kind}`}
          aria-hidden="true"
          focusable="false"
        />
        <div>
          <h3 id={`catalog-${kind}`}>{category.group}</h3>
          <p>{category.role}</p>
        </div>
        <div className="component-library-section__actions">
          <span>{componentCount}</span>
          {quickAdd}
        </div>
      </header>
      <div className="component-library-section__options">
        {options.map((option) => (
          <ComponentOption
            key={option.variantId}
            option={option}
            onAdd={(selected) => onAddNode(selected.kind, selected.variantId)}
          />
        ))}
      </div>
    </section>
  );
}
