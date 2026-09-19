import { getArchitectureVariant, getConnectionProtocol } from './catalog';
import {
  ARCHITECTURE_AUTOSAVE_STORAGE_KEY,
  ARCHITECTURE_LEGACY_CANVAS_STORAGE_KEY,
  ARCHITECTURE_STORAGE_MIGRATION_KEY,
  ARCHITECTURE_VERSIONS_STORAGE_KEY,
} from '../../../shared/config';
import type {
  ArchitectureEdge,
  ArchitectureNode,
  ArchitectureNodeKind,
  ArchitectureSnapshot,
  ArchitectureVersion,
  EdgeAnchor,
} from './architecture.types';
import type { LegacyCanvasElement } from './persistence.types';

export const AUTOSAVE_KEY = ARCHITECTURE_AUTOSAVE_STORAGE_KEY;
export const VERSIONS_KEY = ARCHITECTURE_VERSIONS_STORAGE_KEY;

export const makeArchitectureNode = (
  kind: ArchitectureNodeKind,
  variantId: string,
  x: number,
  y: number,
  label?: string,
): ArchitectureNode => ({
  id: `${kind}-${crypto.randomUUID()}`,
  type: 'architecture',
  position: { x, y },
  data: { kind, variantId, label: label ?? getArchitectureVariant(kind, variantId).label },
});

export const createInitialArchitectureSnapshot = (): ArchitectureSnapshot => ({
  nodes: [
    makeArchitectureNode('client', 'abstract', 80, 180, 'Client'),
    makeArchitectureNode('service', 'abstract', 560, 180, 'Service'),
  ],
  edges: [],
});
export const normalizeArchitectureSnapshot = <T extends ArchitectureSnapshot>(value: T): T => ({
  ...value,
  nodes: value.nodes.map((node) => ({ ...node, selected: false })),
  edges: value.edges.map((edge) => ({ ...edge, type: 'architecture', selected: false })),
});

const architectureNodeKinds = new Set<ArchitectureNodeKind>(['client', 'load-balancer', 'service']);
const edgeAnchorSides = new Set<EdgeAnchor['side']>(['top', 'right', 'bottom', 'left']);

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function isOptionalBoolean(value: unknown): value is boolean | undefined {
  return value === undefined || typeof value === 'boolean';
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function isEdgeAnchor(value: unknown): value is EdgeAnchor {
  if (!isRecord(value)) return false;
  const { side, offset } = value;
  return (
    typeof side === 'string' &&
    edgeAnchorSides.has(side as EdgeAnchor['side']) &&
    isFiniteNumber(offset) &&
    offset >= 0 &&
    offset <= 1
  );
}

function isArchitectureNode(value: unknown): value is ArchitectureNode {
  if (!isRecord(value) || !isRecord(value.position) || !isRecord(value.data)) return false;
  const { id, type, position, data, selected } = value;
  return (
    isNonEmptyString(id) &&
    type === 'architecture' &&
    isFiniteNumber(position.x) &&
    isFiniteNumber(position.y) &&
    typeof data.kind === 'string' &&
    architectureNodeKinds.has(data.kind as ArchitectureNodeKind) &&
    isNonEmptyString(data.variantId) &&
    typeof data.label === 'string' &&
    isOptionalBoolean(data.isAnchor) &&
    isOptionalBoolean(selected)
  );
}

function isArchitectureEdgeData(value: unknown): value is NonNullable<ArchitectureEdge['data']> {
  if (!isRecord(value) || typeof value.protocol !== 'string') return false;
  if (value.bend !== undefined) {
    if (
      !isRecord(value.bend) ||
      !isFiniteNumber(value.bend.along) ||
      !isFiniteNumber(value.bend.normal)
    ) {
      return false;
    }
  }
  if (value.sourceAnchor !== undefined && !isEdgeAnchor(value.sourceAnchor)) return false;
  if (value.targetAnchor !== undefined && !isEdgeAnchor(value.targetAnchor)) return false;
  return true;
}

function isArchitectureEdge(value: unknown): value is ArchitectureEdge {
  if (!isRecord(value)) return false;
  const { id, source, target, type, data, label, selected } = value;
  return (
    isNonEmptyString(id) &&
    isNonEmptyString(source) &&
    isNonEmptyString(target) &&
    type === 'architecture' &&
    (data === undefined || isArchitectureEdgeData(data)) &&
    (label === undefined || typeof label === 'string') &&
    isOptionalBoolean(selected)
  );
}

function hasUniqueIds(values: readonly { id: string }[]): boolean {
  return new Set(values.map(({ id }) => id)).size === values.length;
}

function isArchitectureSnapshot(value: unknown): value is ArchitectureSnapshot {
  if (!isRecord(value) || !Array.isArray(value.nodes) || !Array.isArray(value.edges)) return false;
  if (!value.nodes.every(isArchitectureNode) || !value.edges.every(isArchitectureEdge))
    return false;
  return hasUniqueIds(value.nodes) && hasUniqueIds(value.edges);
}

export function parseArchitectureSnapshot(serialized: string | null): ArchitectureSnapshot | null {
  if (!serialized) return null;
  try {
    const value: unknown = JSON.parse(serialized);
    return isArchitectureSnapshot(value) ? normalizeArchitectureSnapshot(value) : null;
  } catch {
    return null;
  }
}

export function migrateLegacyArchitectureCanvas(
  serialized: string | null,
): ArchitectureSnapshot | null {
  if (!serialized) return null;
  let legacy: LegacyCanvasElement[];
  try {
    const value: unknown = JSON.parse(serialized);
    if (!Array.isArray(value)) return null;
    legacy = value as LegacyCanvasElement[];
  } catch {
    return null;
  }

  const nodes = legacy.flatMap((element) => {
    const kind = element.customData?.componentKind;
    if (element.isDeleted || !kind) return [];
    const variantId = element.customData?.componentVariant ?? 'abstract';
    return [
      {
        id: element.id,
        type: 'architecture' as const,
        position: { x: element.x, y: element.y },
        data: { kind, variantId, label: getArchitectureVariant(kind, variantId).label },
      },
    ];
  });
  if (!nodes.length) return null;

  const ids = new Set(nodes.map((node) => node.id));
  const edges = legacy
    .filter((element) => !element.isDeleted && element.type === 'arrow')
    .flatMap((element) => {
      const source = element.startBinding?.elementId;
      const target = element.endBinding?.elementId;
      if (!source || !target || !ids.has(source) || !ids.has(target)) return [];
      const sourceNode = nodes.find((node) => node.id === source);
      if (!sourceNode) return [];
      const label = getConnectionProtocol(sourceNode.data.kind);
      return [
        {
          id: element.id,
          source,
          target,
          type: 'architecture' as const,
          data: { protocol: label },
          label,
        },
      ];
    });
  return { nodes, edges };
}

export function parseArchitectureVersions(serialized: string | null): ArchitectureVersion[] {
  if (!serialized) return [];
  try {
    const value: unknown = JSON.parse(serialized);
    if (!Array.isArray(value)) return [];
    return value.flatMap((entry) => {
      if (!entry || typeof entry !== 'object') return [];
      const version = entry as Partial<ArchitectureVersion>;
      const { id, name, createdAt } = version;
      if (
        typeof id !== 'string' ||
        typeof name !== 'string' ||
        typeof createdAt !== 'string' ||
        !isArchitectureSnapshot(version)
      ) {
        return [];
      }
      const legacyIndex = name.match(/^Architecture(?:Version)?\s+(\d+)$/i)?.[1];
      const snapshot = normalizeArchitectureSnapshot({
        nodes: version.nodes,
        edges: version.edges,
      });
      return [
        {
          ...snapshot,
          id,
          name: legacyIndex ? `Commit ${legacyIndex}` : name,
          createdAt,
        },
      ];
    });
  } catch {
    return [];
  }
}

export function readArchitectureSnapshot(): ArchitectureSnapshot {
  try {
    if (!localStorage.getItem(ARCHITECTURE_STORAGE_MIGRATION_KEY)) {
      const migrated = migrateLegacyArchitectureCanvas(
        localStorage.getItem(ARCHITECTURE_LEGACY_CANVAS_STORAGE_KEY),
      );
      if (migrated) return migrated;
    }
    return (
      parseArchitectureSnapshot(localStorage.getItem(AUTOSAVE_KEY)) ??
      createInitialArchitectureSnapshot()
    );
  } catch {
    /* reset corrupt local state */
  }
  return createInitialArchitectureSnapshot();
}

export function readArchitectureVersions(): ArchitectureVersion[] {
  return parseArchitectureVersions(localStorage.getItem(VERSIONS_KEY));
}
