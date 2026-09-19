import { ChevronDown, ChevronsRight, Plus, Search } from 'lucide-react';
import {
  architectureCategoryIcons,
  architectureMeta,
  architectureVariants,
} from '@/entities/architecture';
import { cn } from '@/shared/lib';
import { ComponentOption } from './ComponentOption';
import type { ComponentOptionData, RegistryCategoryProps } from './RequirementSidebar.types';

export function RegistryCategory({
  kind,
  expanded,
  query,
  onToggle,
  onQueryChange,
  onAddNode,
}: RegistryCategoryProps) {
  const CategoryIcon = architectureCategoryIcons[kind];
  const ExpandIcon = expanded ? ChevronDown : ChevronsRight;
  const groupName = architectureMeta[kind].group;
  const options = architectureVariants[kind]
    .filter(
      (variant) =>
        variant.concrete &&
        `${variant.label} ${variant.description}`.toLowerCase().includes(query.toLowerCase()),
    )
    .map<ComponentOptionData>((variant) => ({
      kind,
      variantId: variant.id,
      label: variant.label,
      description: variant.description,
      meta: 'specific',
      icon: variant.icon,
    }));

  return (
    <section className={cn('registry-group', expanded && 'registry-group--active')}>
      <div className="registry-category">
        <button className="registry-category-main" type="button" onClick={onToggle}>
          <CategoryIcon aria-hidden="true" focusable="false" />
          <span>
            <strong>{groupName}</strong>
            <small>Browse concrete components</small>
          </span>
        </button>
        <button
          className="registry-add"
          type="button"
          onClick={() => onAddNode(kind)}
          aria-label={`Quick add ${groupName}`}
          title={`Quick add generic ${groupName.toLowerCase()}`}
        >
          <Plus aria-hidden="true" focusable="false" />
        </button>
        <button
          className="registry-expand"
          type="button"
          onClick={onToggle}
          aria-label={`Browse ${groupName}`}
          aria-expanded={expanded}
        >
          <ExpandIcon aria-hidden="true" focusable="false" />
        </button>
      </div>
      {expanded && (
        <div className="component-picker component-picker--inline">
          <label className="group-search">
            <Search aria-hidden="true" focusable="false" />
            <input
              aria-label={`Search ${groupName}`}
              value={query}
              onChange={(event) => onQueryChange(event.target.value)}
              placeholder={`Search ${groupName.toLowerCase()}…`}
            />
          </label>
          {options.map((option) => (
            <ComponentOption
              key={option.variantId}
              option={option}
              onAdd={(selected) => onAddNode(selected.kind, selected.variantId)}
            />
          ))}
        </div>
      )}
    </section>
  );
}
