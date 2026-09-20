import { ArchitectureSidebarGraph } from '@/entities/architecture';
import { cn } from '@/shared/lib';
import type { SolutionsSidebarProps } from './RequirementSidebar.types';

export function SolutionsSidebar({
  solutions,
  selectedSolutionId,
  onSolutionChange,
  nodes,
  edges,
  connectionStates,
  validationStates,
  layersExpanded,
  onLayersExpandedChange,
  onFocusNode,
}: SolutionsSidebarProps) {
  const selectedSolution =
    solutions.find((solution) => solution.id === selectedSolutionId) ?? solutions[0];

  return (
    <>
      <section className="solutions-sidebar" aria-labelledby="solutions-title">
        <header>
          <h1 className="panel-id" id="solutions-title">
            REFERENCE SOLUTIONS
          </h1>
          <p>Open a known-good architecture on the canvas and validate it.</p>
        </header>
        <div className="solutions-sidebar__list">
          {solutions.map((solution) => {
            const selected = solution.id === selectedSolution?.id;
            return (
              <button
                key={solution.id}
                type="button"
                className={cn(selected && 'solution-option--active')}
                aria-pressed={selected}
                onClick={() => onSolutionChange(solution.id)}
              >
                <strong>{solution.name}</strong>
                <small>{solution.description}</small>
              </button>
            );
          })}
        </div>
      </section>
      <section className="sidebar-section layers" aria-label="Architecture components">
        <ArchitectureSidebarGraph
          nodes={nodes}
          edges={edges}
          connectionStates={connectionStates}
          validationStates={validationStates}
          readOnly
          expanded={layersExpanded}
          onToggleExpanded={() => onLayersExpandedChange(!layersExpanded)}
          onFocus={onFocusNode}
        />
      </section>
    </>
  );
}
