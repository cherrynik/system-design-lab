import { getArchitectureVariant, getConnectionProtocol } from './catalog';
import {
  ARCHITECTURE_AUTOSAVE_STORAGE_KEY,
  ARCHITECTURE_LEGACY_CANVAS_STORAGE_KEY,
  ARCHITECTURE_STORAGE_MIGRATION_KEY,
  ARCHITECTURE_VERSIONS_STORAGE_KEY,
} from '../../../shared/config';
import type {
  ArchitectureNode,
  ArchitectureNodeKind,
  ArchitectureSnapshot,
  ArchitectureVersion,
} from './types';

export const AUTOSAVE_KEY = ARCHITECTURE_AUTOSAVE_STORAGE_KEY;
export const VERSIONS_KEY = ARCHITECTURE_VERSIONS_STORAGE_KEY;

type LegacyCanvasElement = {
  id: string;
  isDeleted?: boolean;
  type?: string;
  x: number;
  y: number;
  customData?: {
    componentKind?: ArchitectureNodeKind;
    componentVariant?: string;
  };
  startBinding?: { elementId?: string };
  endBinding?: { elementId?: string };
};

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

function isArchitectureSnapshot(value: unknown): value is ArchitectureSnapshot {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<ArchitectureSnapshot>;
  return Array.isArray(candidate.nodes) && Array.isArray(candidate.edges);
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
