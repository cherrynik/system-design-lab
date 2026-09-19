import { useRef } from 'react';
import type { RefObject } from 'react';
import {
  ChevronDown,
  ChevronsLeft,
  ChevronsRight,
  Crosshair,
  Plus,
  Search,
  SlidersHorizontal,
  Trash2,
  X,
} from 'lucide-react';
import {
  architectureCategoryIcons,
  architectureMeta,
  architectureVariants,
  ArchitectureSidebarGraph,
} from '@/entities/architecture';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  IconButton,
  Input,
  Kbd,
  Tabs,
  TabsList,
  TabsTrigger,
} from '@/shared/ui';
import type {
  ArchitectureEdge,
  ArchitectureNode,
  ArchitectureNodeConnectionState,
  ArchitectureNodeKind,
  ArchitectureNodeValidationState,
  ReferenceSolution,
} from '@/entities/architecture';

type ContextMenu = { id: string; x: number; y: number };

type RequirementSidebarProps = {
  collapsed: boolean;
  view: 'canvas' | 'solutions';
  solutions: ReferenceSolution[];
  selectedSolutionId: string;
  requirementsExpanded: boolean;
  layersExpanded: boolean;
  requirementStatus: string;
  runnerStatus: 'idle' | 'running' | 'ready' | 'warning' | 'error';
  nodes: ArchitectureNode[];
  edges: ArchitectureEdge[];
  connectionStates: Map<string, ArchitectureNodeConnectionState>;
  validationStates?: Map<string, ArchitectureNodeValidationState>;
  registryOpen: boolean;
  query: string;
  group: ArchitectureNodeKind | null;
  groupQuery: string;
  usesCommandKey: boolean;
  menu: ContextMenu | null;
  contextMenuRef: RefObject<HTMLDivElement | null>;
  onCollapsedChange: (collapsed: boolean) => void;
  onViewChange: (view: 'canvas' | 'solutions') => void;
  onSolutionChange: (solutionId: string) => void;
  onRequirementsExpandedChange: (expanded: boolean) => void;
  onLayersExpandedChange: (expanded: boolean) => void;
  onRegistryOpenChange: (open: boolean) => void;
  onQueryChange: (query: string) => void;
  onGroupChange: (group: ArchitectureNodeKind | null) => void;
  onGroupQueryChange: (query: string) => void;
  onMenuChange: (menu: ContextMenu | null) => void;
  onAddNode: (kind: ArchitectureNodeKind, variantId?: string) => void;
  onFocusNode: (nodeId: string) => void;
  onInspectNode: (nodeId: string) => void;
  onRenameNode: (nodeId: string, label: string) => void;
  onDeleteNode: (nodeId: string) => void;
};

export function RequirementSidebar({
  collapsed,
  view,
  solutions,
  selectedSolutionId,
  requirementsExpanded,
  layersExpanded,
  requirementStatus,
  runnerStatus,
  nodes,
  edges,
  connectionStates,
  validationStates,
  registryOpen,
  query,
  group,
  groupQuery,
  usesCommandKey,
  menu,
  contextMenuRef,
  onCollapsedChange,
  onViewChange,
  onSolutionChange,
  onRequirementsExpandedChange,
  onLayersExpandedChange,
  onRegistryOpenChange,
  onQueryChange,
  onGroupChange,
  onGroupQueryChange,
  onMenuChange,
  onAddNode,
  onFocusNode,
  onInspectNode,
  onRenameNode,
  onDeleteNode,
}: RequirementSidebarProps) {
  const searchRef = useRef<HTMLInputElement | null>(null);
  const registryDialogRef = useRef<HTMLDivElement | null>(null);
  const selectedSolution =
    solutions.find((solution) => solution.id === selectedSolutionId) ?? solutions[0];
  const searchResults = query.trim()
    ? (Object.keys(architectureVariants) as ArchitectureNodeKind[]).flatMap((kind) =>
        architectureVariants[kind]
          .filter((variant) =>
            `${variant.label} ${variant.description} ${variant.type}`
              .toLowerCase()
              .includes(query.trim().toLowerCase()),
          )
          .map((variant) => ({ kind, variant })),
      )
    : [];

  return (
    <aside
      className={`panel requirements-panel ${collapsed ? 'requirements-panel--collapsed' : ''}`}
    >
      <div className="panel-heading">
        {!collapsed && (
          <Tabs
            value={view}
            onValueChange={(value) => onViewChange(value as 'canvas' | 'solutions')}
          >
            <TabsList className="sidebar-view-tabs" variant="line" aria-label="Task views">
              <TabsTrigger value="canvas">Description</TabsTrigger>
              <TabsTrigger value="solutions">Solutions</TabsTrigger>
            </TabsList>
          </Tabs>
        )}
        <IconButton
          label={collapsed ? 'Expand requirements' : 'Collapse requirements'}
          className="collapse-button"
          variant="outline"
          size="icon"
          onClick={() => onCollapsedChange(!collapsed)}
        >
          {collapsed ? <ChevronsRight /> : <ChevronsLeft />}
        </IconButton>
      </div>

      {!collapsed &&
        (view === 'solutions' ? (
          <div className="solutions-sidebar">
            <div>
              <span className="panel-id">REFERENCE SOLUTIONS</span>
              <p>Open a known-good architecture on the canvas and validate it.</p>
            </div>
            <div className="solutions-sidebar__list">
              {solutions.map((solution) => (
                <button
                  key={solution.id}
                  className={solution.id === selectedSolution.id ? 'solution-option--active' : ''}
                  onClick={() => onSolutionChange(solution.id)}
                >
                  <strong>{solution.name}</strong>
                  <small>{solution.description}</small>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            <div className="sidebar-section requirements-section">
              <button
                className="sidebar-section-toggle"
                aria-expanded={requirementsExpanded}
                onClick={() => onRequirementsExpandedChange(!requirementsExpanded)}
              >
                <span className="panel-id">REQUIREMENTS</span>
                <span className={`problem-status problem-status--${runnerStatus}`}>
                  <i /> {requirementStatus}
                </span>
                {requirementsExpanded ? <ChevronDown /> : <ChevronsRight />}
              </button>
              {requirementsExpanded && <RequirementMarkdown />}
            </div>

            <div className="sidebar-section layers">
              <ArchitectureSidebarGraph
                nodes={nodes}
                edges={edges}
                connectionStates={connectionStates}
                validationStates={validationStates}
                expanded={layersExpanded}
                onToggleExpanded={() => onLayersExpandedChange(!layersExpanded)}
                onAddComponent={() => onRegistryOpenChange(true)}
                onFocus={onFocusNode}
                onRename={onRenameNode}
                onOpenMenu={(id, x, y) => onMenuChange({ id, x, y })}
              />
            </div>

            <Dialog open={registryOpen} onOpenChange={onRegistryOpenChange}>
              <DialogContent
                ref={registryDialogRef}
                className="sidebar-section catalog component-library top-[14vh] max-w-none translate-y-0"
                showCloseButton={false}
              >
                <DialogHeader className="component-library__header">
                  <div>
                    <DialogTitle className="panel-id">COMPONENT LIBRARY</DialogTitle>
                    <DialogDescription>Search or browse by category</DialogDescription>
                  </div>
                  <IconButton
                    label="Close component library"
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => onRegistryOpenChange(false)}
                  >
                    <X />
                  </IconButton>
                </DialogHeader>
                <label className="catalog-search">
                  <Search />
                  <Input
                    ref={searchRef}
                    aria-label="Search components"
                    placeholder="Search components…"
                    value={query}
                    onChange={(event) => onQueryChange(event.target.value)}
                  />
                  <Kbd>{usesCommandKey ? '⌘' : 'Ctrl'} K</Kbd>
                </label>
                {query.trim() ? (
                  <div className="component-picker search-results">
                    {searchResults.length ? (
                      searchResults.map(({ kind, variant }) => {
                        const Icon = variant.icon;
                        return (
                          <button
                            className="component-option"
                            key={`${kind}-${variant.id}`}
                            onClick={() => onAddNode(kind, variant.id)}
                          >
                            <Icon />
                            <span>
                              <strong>{variant.label}</strong>
                              <small>{variant.description}</small>
                            </span>
                            <em>{architectureMeta[kind].group}</em>
                          </button>
                        );
                      })
                    ) : (
                      <div className="component-library__empty">
                        <Search />
                        <strong>No components found</strong>
                        <small>Try another name or browse a category.</small>
                      </div>
                    )}
                  </div>
                ) : (
                  <RegistryCategories
                    activeGroup={group}
                    groupQuery={groupQuery}
                    onGroupChange={onGroupChange}
                    onGroupQueryChange={onGroupQueryChange}
                    onAddNode={onAddNode}
                  />
                )}
              </DialogContent>
            </Dialog>

            {menu && (
              <div
                ref={contextMenuRef}
                className="context-menu"
                role="menu"
                aria-label="Component actions"
                style={{ left: menu.x, top: menu.y }}
                onPointerDown={(event) => event.stopPropagation()}
              >
                <button
                  role="menuitem"
                  onClick={() => {
                    onFocusNode(menu.id);
                    onMenuChange(null);
                  }}
                >
                  <Crosshair />
                  Focus on canvas
                </button>
                <button
                  role="menuitem"
                  onClick={() => {
                    onInspectNode(menu.id);
                    onMenuChange(null);
                  }}
                >
                  <SlidersHorizontal />
                  Inspect component
                </button>
                <button
                  role="menuitem"
                  className="context-menu__danger"
                  onClick={() => onDeleteNode(menu.id)}
                >
                  <Trash2 />
                  Delete component
                </button>
              </div>
            )}
          </>
        ))}
    </aside>
  );
}

function RequirementMarkdown() {
  return (
    <div className="requirements-content">
      <h2>Route web traffic to an HTTP API</h2>
      <p className="lead">
        A browser request must reach an HTTP handler through the architecture you build.
      </p>
      <h3>Request contract</h3>
      <ul className="requirement-list">
        <li>
          <strong>Entry point:</strong> Web Browser
        </li>
        <li>
          <strong>Request:</strong> <code>GET /{'{path}'}</code>
        </li>
        <li>
          <strong>Transport:</strong> <code>HTTPS</code>
        </li>
        <li>
          <strong>Target capability:</strong> <code>http.handle</code>
        </li>
        <li>
          <strong>Assertion:</strong> <code>path.exists</code>
        </li>
      </ul>
      <h3>Acceptance rule</h3>
      <pre className="acceptance-rule">
        <code>
          <i>path</i>(source: http.request, target: http.handle) == <b>true</b>
        </code>
      </pre>
    </div>
  );
}

function RegistryCategories({
  activeGroup,
  groupQuery,
  onGroupChange,
  onGroupQueryChange,
  onAddNode,
}: {
  activeGroup: ArchitectureNodeKind | null;
  groupQuery: string;
  onGroupChange: (group: ArchitectureNodeKind | null) => void;
  onGroupQueryChange: (query: string) => void;
  onAddNode: (kind: ArchitectureNodeKind, variantId?: string) => void;
}) {
  return (
    <div className="registry-categories">
      {(Object.keys(architectureVariants) as ArchitectureNodeKind[]).map((kind) => {
        const Icon = architectureCategoryIcons[kind];
        const expanded = activeGroup === kind;
        const toggle = () => {
          onGroupChange(expanded ? null : kind);
          onGroupQueryChange('');
        };
        return (
          <div className={`registry-group ${expanded ? 'registry-group--active' : ''}`} key={kind}>
            <div className="registry-category">
              <button className="registry-category-main" onClick={toggle}>
                <Icon />
                <span>
                  <strong>{architectureMeta[kind].group}</strong>
                  <small>Browse concrete components</small>
                </span>
              </button>
              <button
                className="registry-add"
                onClick={() => onAddNode(kind)}
                aria-label={`Quick add ${architectureMeta[kind].group}`}
                title={`Quick add generic ${architectureMeta[kind].group.toLowerCase()}`}
              >
                <Plus />
              </button>
              <button
                className="registry-expand"
                onClick={toggle}
                aria-label={`Browse ${architectureMeta[kind].group}`}
              >
                {expanded ? <ChevronDown /> : <ChevronsRight />}
              </button>
            </div>
            {expanded && (
              <div className="component-picker component-picker--inline">
                <label className="group-search">
                  <Search />
                  <input
                    aria-label={`Search ${architectureMeta[kind].group}`}
                    value={groupQuery}
                    onChange={(event) => onGroupQueryChange(event.target.value)}
                    placeholder={`Search ${architectureMeta[kind].group.toLowerCase()}…`}
                  />
                </label>
                {architectureVariants[kind]
                  .filter(
                    (variant) =>
                      variant.concrete &&
                      `${variant.label} ${variant.description}`
                        .toLowerCase()
                        .includes(groupQuery.toLowerCase()),
                  )
                  .map((variant) => {
                    const VariantIcon = variant.icon;
                    return (
                      <button
                        className="component-option"
                        key={variant.id}
                        onClick={() => onAddNode(kind, variant.id)}
                      >
                        <VariantIcon />
                        <span>
                          <strong>{variant.label}</strong>
                          <small>{variant.description}</small>
                        </span>
                        <em>specific</em>
                      </button>
                    );
                  })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
