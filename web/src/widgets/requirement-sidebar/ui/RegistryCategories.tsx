import { Boxes } from 'lucide-react';
import { architectureVariants } from '@/entities/architecture';
import type { ArchitectureNodeKind } from '@/entities/architecture';
import { cn } from '@/shared/lib';
import { RegistryCategory } from './RegistryCategory';
import type { RegistryCategoriesProps } from './RequirementSidebar.types';

const categoryKinds = Object.keys(architectureVariants) as ArchitectureNodeKind[];

export function RegistryCategories({
  group,
  onGroupChange,
  onQueryChange,
}: RegistryCategoriesProps) {
  const allSelected = group === null;
  const allClassName = cn('registry-category', allSelected && 'registry-category--active');
  const componentCount = categoryKinds.reduce(
    (count, kind) =>
      count + architectureVariants[kind].filter((variant) => variant.concrete).length,
    0,
  );
  let current: 'page' | undefined;

  if (allSelected) current = 'page';

  const selectGroup = (kind: ArchitectureNodeKind | null) => {
    onQueryChange('');
    onGroupChange(kind);
  };

  return (
    <nav className="registry-categories" aria-label="Component categories">
      <p>Browse by role</p>
      <button
        className={allClassName}
        type="button"
        onClick={() => selectGroup(null)}
        aria-current={current}
      >
        <Boxes aria-hidden="true" focusable="false" />
        <span>
          <strong>All components</strong>
          <small>Full catalog</small>
        </span>
        <em>{componentCount}</em>
      </button>
      {categoryKinds.map((kind) => (
        <RegistryCategory
          key={kind}
          kind={kind}
          selected={group === kind}
          onSelect={() => selectGroup(kind)}
        />
      ))}
    </nav>
  );
}
