import { useCallback, useMemo, useRef, useState } from 'react';
import {
  normalizeArchitectureSnapshot,
  type ArchitectureSnapshot,
  type ArchitectureVersion,
} from '../../../entities/architecture';
import {
  createLocalStorageArchitectureVersionRepository,
  type ArchitectureVersionRepository,
} from './architectureVersionRepository';

const defaultIdFactory = () => crypto.randomUUID();
const defaultNow = () => new Date();

type ArchitectureVersionsOptions = {
  idFactory?: () => string;
  now?: () => Date;
  repository?: ArchitectureVersionRepository;
};

function cloneSnapshot(snapshot: ArchitectureSnapshot): ArchitectureSnapshot {
  return {
    nodes: snapshot.nodes.map((node) => ({
      ...node,
      position: { ...node.position },
      data: { ...node.data },
      selected: false,
    })),
    edges: snapshot.edges.map((edge) => ({
      ...edge,
      data: edge.data
        ? {
            ...edge.data,
            bend: edge.data.bend ? { ...edge.data.bend } : undefined,
            sourceAnchor: edge.data.sourceAnchor ? { ...edge.data.sourceAnchor } : undefined,
            targetAnchor: edge.data.targetAnchor ? { ...edge.data.targetAnchor } : undefined,
          }
        : undefined,
      selected: false,
    })),
  };
}

export function useArchitectureVersions({
  idFactory = defaultIdFactory,
  now = defaultNow,
  repository,
}: ArchitectureVersionsOptions = {}) {
  const activeRepository = useMemo(
    () => repository ?? createLocalStorageArchitectureVersionRepository(window.localStorage),
    [repository],
  );
  const [versions, setVersions] = useState<ArchitectureVersion[]>(() => activeRepository.load());
  const versionsRef = useRef(versions);

  const persist = useCallback(
    (next: ArchitectureVersion[]) => {
      versionsRef.current = next;
      setVersions(next);
      return activeRepository.save(next);
    },
    [activeRepository],
  );

  const commit = useCallback(
    (snapshot: ArchitectureSnapshot) => {
      const current = versionsRef.current;
      const version: ArchitectureVersion = {
        ...normalizeArchitectureSnapshot(snapshot),
        id: idFactory(),
        name: `Commit ${current.length + 1}`,
        createdAt: now().toISOString(),
      };
      persist([version, ...current]);
      return version;
    },
    [idFactory, now, persist],
  );

  const rename = useCallback(
    (versionId: string, name: string) => {
      const trimmedName = name.trim();
      if (!trimmedName) return false;

      let found = false;
      const next = versionsRef.current.map((version) => {
        if (version.id !== versionId) return version;
        found = true;
        return version.name === trimmedName ? version : { ...version, name: trimmedName };
      });
      if (!found) return false;

      persist(next);
      return true;
    },
    [persist],
  );

  const deleteLatest = useCallback(() => {
    const [latest, ...remaining] = versionsRef.current;
    if (!latest) return null;
    persist(remaining);
    return latest;
  }, [persist]);

  const restore = useCallback((versionId: string) => {
    const version = versionsRef.current.find((candidate) => candidate.id === versionId);
    return version ? cloneSnapshot(version) : null;
  }, []);

  return {
    versions,
    latestVersion: versions[0],
    commit,
    rename,
    deleteLatest,
    restore,
  };
}
