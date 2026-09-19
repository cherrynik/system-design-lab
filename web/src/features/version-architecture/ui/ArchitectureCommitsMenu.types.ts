import type { ArchitectureVersion } from '@/entities/architecture';

export type ArchitectureCommitsMenuProps = {
  versions: ArchitectureVersion[];
  dirty?: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCommit: () => void;
  onRestore: (version: ArchitectureVersion) => void;
  onRename: (versionId: string, name: string) => void;
  onDeleteLatest: () => void;
};

export type ArchitectureCommitRowProps = {
  version: ArchitectureVersion;
  editing: boolean;
  latest: boolean;
  draft: string;
  onDraftChange: (value: string) => void;
  onBeginRename: (version: ArchitectureVersion) => void;
  onFinishRename: () => void;
  onCancelRename: () => void;
  onRestore: (version: ArchitectureVersion) => void;
  onDeleteLatest: () => void;
};
