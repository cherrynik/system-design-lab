import { architectureMeta, architectureVariants } from '@/entities/architecture';
import type { ArchitectureNodeKind } from '@/entities/architecture';
import { ComponentLibrarySection } from './ComponentLibrarySection';
import type { ComponentCatalogProps } from './RequirementSidebar.types';

const categoryKinds = Object.keys(architectureVariants) as ArchitectureNodeKind[];

export function ComponentCatalog({ group, onAddNode }: ComponentCatalogProps) {
  let title = 'Architecture primitives';
  let description =
    'Start abstract, then switch to a concrete implementation when the design needs it.';
  let visibleKinds = categoryKinds;
  let groupCount = `${visibleKinds.length} groups`;

  if (group) {
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
      <div className="component-catalog__sections">
        {visibleKinds.map((kind) => (
          <ComponentLibrarySection key={kind} kind={kind} onAddNode={onAddNode} />
        ))}
      </div>
    </div>
  );
}
