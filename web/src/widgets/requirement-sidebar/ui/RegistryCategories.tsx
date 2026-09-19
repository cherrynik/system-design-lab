import { architectureVariants } from '@/entities/architecture';
import type { ArchitectureNodeKind } from '@/entities/architecture';
import { RegistryCategory } from './RegistryCategory';
import type { RegistryCategoriesProps } from './RequirementSidebar.types';

export function RegistryCategories({
  activeGroup,
  groupQuery,
  onGroupChange,
  onGroupQueryChange,
  onAddNode,
}: RegistryCategoriesProps) {
  return (
    <div className="registry-categories">
      {(Object.keys(architectureVariants) as ArchitectureNodeKind[]).map((kind) => {
        const expanded = activeGroup === kind;
        let nextGroup: ArchitectureNodeKind | null = kind;
        if (expanded) nextGroup = null;
        const toggle = () => {
          onGroupChange(nextGroup);
          onGroupQueryChange('');
        };
        return (
          <RegistryCategory
            key={kind}
            kind={kind}
            expanded={expanded}
            query={groupQuery}
            onToggle={toggle}
            onQueryChange={onGroupQueryChange}
            onAddNode={onAddNode}
          />
        );
      })}
    </div>
  );
}
