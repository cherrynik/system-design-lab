export {
  architectureCategoryIcons,
  architectureMeta,
  architectureVariants,
  getArchitectureVariant,
  getArrowProtocol,
  getConnectionProtocol,
} from './model/catalog';
export type { ArchitectureMeta, ArchitectureVariant } from './model/catalog';
export {
  isArchitectureCardDoubleClick,
  isBrowserZoomShortcut,
  isSupportedArchitectureCanvasShape,
  resolveArchitectureCardLabel,
} from './model/canvasInteractions';
export { normalizeComponentLabel, renameArchitectureNode } from './model/nodes';
export { getArchitectureNodeConnectionStates, getConnectionStateText } from './model/connections';
export type {
  ArchitectureConnectionDirection,
  ArchitectureNodeConnectionState,
} from './model/connections.types';
export {
  getArchitectureNodeValidationIssues,
  validateArchitectureNodes,
} from './model/nodeValidation';
export type {
  ArchitectureNodeValidationIssue,
  ArchitectureNodeValidationSeverity,
  ArchitectureNodeValidationState,
} from './model/nodeValidation.types';
export { buildSidebarGraphLayout, sidebarGraphRowHeight } from './model/sidebarGraph';
export {
  AUTOSAVE_KEY,
  VERSIONS_KEY,
  createInitialArchitectureSnapshot,
  makeArchitectureNode,
  migrateLegacyArchitectureCanvas,
  normalizeArchitectureSnapshot,
  parseArchitectureSnapshot,
  parseArchitectureVersions,
  readArchitectureSnapshot,
  readArchitectureVersions,
} from './model/persistence';
export type {
  ArchitectureEdge,
  ArchitectureNode,
  ArchitectureNodeData,
  ArchitectureNodeKind,
  ArchitectureSnapshot,
  ArchitectureVersion,
  EdgeAnchor,
} from './model/architecture.types';
export { createReferenceSolutionSnapshot, referenceSolutions } from './model/referenceSolutions';
export type {
  ReferenceSolution,
  ReferenceSolutionConnection,
} from './model/referenceSolutions.types';
export { ArchitectureLayerItem } from './ui/ArchitectureLayerItem';
export type {
  ArchitectureLayerItemMode,
  ArchitectureLayerItemProps,
} from './ui/ArchitectureLayerItem.types';
export { ArchitectureSidebarGraph } from './ui/ArchitectureSidebarGraph';
export type {
  ArchitectureSidebarGraphProps,
  ArchitectureSidebarView,
} from './ui/ArchitectureSidebarGraph.types';

export { useConnectionNavigation } from './model/useConnectionNavigation';
export { ArchitectureConnectionNavigationProvider } from './ui/ArchitectureConnectionNavigationProvider';
export type { ArchitectureConnectionNavigationProviderProps } from './ui/ArchitectureConnectionNavigationProvider.types';
