import { ChevronDown, ChevronsRight } from 'lucide-react';
import type { RequirementSectionProps } from './RequirementSidebar.types';

export function RequirementSection({
  expanded,
  requirementStatus,
  runnerStatus,
  onExpandedChange,
  children,
}: RequirementSectionProps) {
  const ToggleIcon = expanded ? ChevronDown : ChevronsRight;

  return (
    <section className="sidebar-section requirements-section">
      <button
        className="sidebar-section-toggle"
        type="button"
        aria-label="Requirements"
        aria-expanded={expanded}
        aria-controls="requirement-document"
        onClick={() => onExpandedChange(!expanded)}
      >
        <span className="panel-id">REQUIREMENTS</span>
        <span className={`problem-status problem-status--${runnerStatus}`}>
          <i /> {requirementStatus}
        </span>
        <ToggleIcon />
      </button>
      {expanded && <div id="requirement-document">{children}</div>}
    </section>
  );
}
