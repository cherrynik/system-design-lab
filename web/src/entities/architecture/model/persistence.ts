import { getArchitectureVariant, getConnectionProtocol } from './catalog';
import type { ArchitectureNode, ArchitectureNodeKind, ArchitectureSnapshot, ArchitectureVersion } from './types';

export const AUTOSAVE_KEY = 'system-design-lab:react-flow';
export const VERSIONS_KEY = 'system-design-lab:flow-versions';
const MIGRATION_KEY = 'system-design-lab:react-flow-migrated';

export const makeArchitectureNode = (kind: ArchitectureNodeKind, variantId: string, x: number, y: number, label?: string): ArchitectureNode => ({ id: `${kind}-${crypto.randomUUID()}`, type: 'architecture', position: { x, y }, data: { kind, variantId, label: label ?? getArchitectureVariant(kind, variantId).label } });

const initial: ArchitectureSnapshot = { nodes: [makeArchitectureNode('client', 'abstract', 80, 180, 'Client'), makeArchitectureNode('service', 'abstract', 560, 180, 'Service')], edges: [] };
const normalizeSnapshot = <T extends ArchitectureSnapshot>(value: T): T => ({ ...value, nodes: value.nodes.map((node) => ({ ...node, selected: false })), edges: value.edges.map((edge) => ({ ...edge, type: 'architecture', selected: false })) });

export function readArchitectureSnapshot(): ArchitectureSnapshot {
  try {
    if (!localStorage.getItem(MIGRATION_KEY)) {
      const legacy = JSON.parse(localStorage.getItem('system-design-lab:canvas') ?? '[]') as Array<Record<string, any>>;
      const nodes = legacy.filter((element) => !element.isDeleted && element.customData?.componentKind).map((element) => {
        const kind = element.customData.componentKind as ArchitectureNodeKind;
        const variantId = element.customData.componentVariant ?? 'abstract';
        return { id: element.id, type: 'architecture' as const, position: { x: element.x, y: element.y }, data: { kind, variantId, label: getArchitectureVariant(kind, variantId).label } };
      });
      const ids = new Set(nodes.map((node) => node.id));
      const edges = legacy.filter((element) => !element.isDeleted && element.type === 'arrow').flatMap((element) => {
        const source = element.startBinding?.elementId; const target = element.endBinding?.elementId;
        if (!source || !target || !ids.has(source) || !ids.has(target)) return [];
        const label = getConnectionProtocol(nodes.find((node) => node.id === source)!.data.kind);
        return [{ id: element.id, source, target, type: 'architecture' as const, data: { protocol: label }, label }];
      });
      localStorage.setItem(MIGRATION_KEY, '1');
      if (nodes.length) return { nodes, edges };
    }
    const value = JSON.parse(localStorage.getItem(AUTOSAVE_KEY) ?? 'null') as ArchitectureSnapshot | null;
    if (value?.nodes && value?.edges) return normalizeSnapshot(value);
  } catch { /* reset corrupt local state */ }
  return initial;
}

export function readArchitectureVersions(): ArchitectureVersion[] {
  try {
    const stored = JSON.parse(localStorage.getItem(VERSIONS_KEY) ?? '[]') as ArchitectureVersion[];
    const versions = stored.map((version) => {
      const legacyIndex = version.name.match(/^Architecture(?:Version)?\s+(\d+)$/i)?.[1];
      return normalizeSnapshot({ ...version, name: legacyIndex ? `Commit ${legacyIndex}` : version.name });
    });
    if (versions.some((version, index) => version.name !== stored[index]?.name)) localStorage.setItem(VERSIONS_KEY, JSON.stringify(versions));
    return versions;
  } catch { return []; }
}
