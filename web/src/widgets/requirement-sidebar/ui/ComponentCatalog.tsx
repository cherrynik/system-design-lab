import { architectureMeta, architectureVariants } from '@/entities/architecture';
import type { ArchitectureNodeKind } from '@/entities/architecture';
import { ComponentLibrarySection } from './ComponentLibrarySection';
import type { ComponentCatalogProps } from './RequirementSidebar.types';

const categoryKinds = Object.keys(architectureVariants) as ArchitectureNodeKind[];

export function ComponentCatalog({ group, onAddNode }: ComponentCatalogProps) {
  let sectionsClassName = 'component-catalog__sections component-catalog__sections--all';
  let title = 'All components';
  let description = 'Choose an implementation, or use Quick add to start with a generic role.';
  let visibleKinds = categoryKinds;
  let groupCount = `${visibleKinds.length} groups`;

  if (group) {
    sectionsClassName = 'component-catalog__sections';
    title = architectureMeta[group].group;
    description = `Add a ${architectureMeta[group].role.toLowerCase()} to the active canvas.`;
    visibleKinds = [group];
    groupCount = '1 group';
  }

  return (
    <div className="component-catalog">
      <header className="component-catalog__intro">
        <div>
          <h2>{title}</h2>
          <p>{description}</p>
        </div>
        <span>{groupCount}</span>
      </header>
      <div className={sectionsClassName}>
        {visibleKinds.map((kind) => (
          <ComponentLibrarySection key={kind} kind={kind} onAddNode={onAddNode} />
        ))}
      </div>
    </div>
  );
}
