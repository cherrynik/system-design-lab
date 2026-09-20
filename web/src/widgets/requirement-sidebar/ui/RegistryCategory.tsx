import {
  architectureCategoryIcons,
  architectureMeta,
  architectureVariants,
} from '@/entities/architecture';
import { cn } from '@/shared/lib';
import type { RegistryCategoryProps } from './RequirementSidebar.types';

export function RegistryCategory({ kind, selected, onSelect }: RegistryCategoryProps) {
  const CategoryIcon = architectureCategoryIcons[kind];
  const category = architectureMeta[kind];
  const count = architectureVariants[kind].length;
  const className = cn('registry-category', selected && 'registry-category--active');
  let current: 'page' | undefined;

  if (selected) current = 'page';

  return (
    <button className={className} type="button" onClick={onSelect} aria-current={current}>
      <CategoryIcon className={`component-logo--${kind}`} aria-hidden="true" focusable="false" />
      <span>
        <strong>{category.group}</strong>
        <small>{category.role}</small>
      </span>
      <em>{count}</em>
    </button>
  );
}
