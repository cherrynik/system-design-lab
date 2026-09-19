export {
  architectureCategoryIcons,
  architectureMeta,
  architectureVariants,
  getArchitectureVariant,
  getArrowProtocol,
  getConnectionProtocol,
} from './model/catalog';
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
} from './model/connections';
export {
  getArchitectureNodeValidationIssues,
  validateArchitectureNodes,
} from './model/nodeValidation';
export type {
  ArchitectureNodeValidationIssue,
  ArchitectureNodeValidationSeverity,
  ArchitectureNodeValidationState,
} from './model/nodeValidation';
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
} from './model/types';
export { referenceSolutions } from './model/referenceSolutions';
export type { ReferenceSolution } from './model/referenceSolutions';
export { ArchitectureLayerItem } from './ui/ArchitectureLayerItem';
export { ArchitectureSidebarGraph } from './ui/ArchitectureSidebarGraph';
