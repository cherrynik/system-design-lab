import { useRef, useState } from 'react';
import { Check, GitBranch, Pencil, Trash2 } from 'lucide-react';
import type { ArchitectureVersion } from '../../../entities/architecture';
import {
  Button,
  IconButton,
  Input,
  Popover,
  PopoverContent,
  PopoverTitle,
  PopoverTrigger,
} from '../../../shared/ui';

type Props = {
  versions: ArchitectureVersion[];
  dirty?: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCommit: () => void;
  onRestore: (version: ArchitectureVersion) => void;
  onRename: (versionId: string, name: string) => void;
  onDeleteLatest: () => void;
};

const shortHash = (id: string) => id.replaceAll('-', '').slice(0, 7);

export function ArchitectureCommitsMenu({
  versions,
  dirty = false,
  open,
  onOpenChange,
  onCommit,
  onRestore,
  onRename,
  onDeleteLatest,
}: Props) {
  const commitButtonRef = useRef<HTMLButtonElement>(null);
  const renameCancelledRef = useRef(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState('');

  const beginRename = (version: ArchitectureVersion) => {
    renameCancelledRef.current = false;
    setEditingId(version.id);
    setDraft(version.name);
  };

  const finishRename = () => {
    if (!editingId) return;
    const name = draft.trim();
    if (!renameCancelledRef.current && name) onRename(editingId, name);
    renameCancelledRef.current = false;
    setEditingId(null);
  };

  return (
    <div className="architecture-commits">
      <Popover open={open} onOpenChange={onOpenChange}>
        <PopoverTrigger
          render={
            <IconButton
              label={dirty ? 'Architecture commits — uncommitted changes' : 'Architecture commits'}
              className={`commits-trigger ${open ? 'commits-trigger--active' : ''}`}
              variant="outline"
              size="icon"
            />
          }
        >
          <GitBranch />
          {dirty && <span className="commits-trigger__dirty" aria-hidden="true" />}
        </PopoverTrigger>
        <PopoverContent
          className="commits-popover"
          role="dialog"
          aria-label="Architecture commits"
          side="bottom"
          align="end"
          sideOffset={8}
          initialFocus={commitButtonRef}
        >
          <header>
            <span className="commits-popover__title">
              <GitBranch />
              <PopoverTitle className="panel-id">COMMITS</PopoverTitle>
            </span>
            <Button
              ref={commitButtonRef}
              className="commit-current-button"
              size="xs"
              onClick={onCommit}
            >
              Commit
            </Button>
          </header>
          {versions.length ? (
            <div className="commit-history">
              {versions.map((version, index) => {
                const isEditing = editingId === version.id;
                const isLatest = index === 0;
                return (
                  <div className="commit-history-row" key={version.id}>
                    <code>{shortHash(version.id)}</code>
                    {isEditing ? (
                      <Input
                        autoFocus
                        value={draft}
                        aria-label={`Rename ${version.name}`}
                        onChange={(event) => setDraft(event.target.value)}
                        onBlur={finishRename}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter') event.currentTarget.blur();
                          if (event.key === 'Escape') {
                            event.stopPropagation();
                            renameCancelledRef.current = true;
                            event.currentTarget.blur();
                          }
                        }}
                      />
                    ) : (
                      <Button
                        className="commit-history-row__restore"
                        variant="ghost"
                        onClick={() => onRestore(version)}
                      >
                        <strong>{version.name}</strong>
                        <small>{new Date(version.createdAt).toLocaleString()}</small>
                      </Button>
                    )}
                    <span className="commit-history-row__actions">
                      <IconButton
                        label={
                          isEditing ? `Finish renaming ${version.name}` : `Rename ${version.name}`
                        }
                        className={`commit-history-row__rename ${isEditing ? 'commit-history-row__rename--done' : ''}`}
                        title={isEditing ? 'Done' : 'Rename commit'}
                        variant="ghost"
                        size="icon-xs"
                        onPointerDown={isEditing ? (event) => event.preventDefault() : undefined}
                        onClick={() => (isEditing ? finishRename() : beginRename(version))}
                      >
                        {isEditing ? <Check /> : <Pencil />}
                      </IconButton>
                      {isLatest && !isEditing && (
                        <IconButton
                          label={`Delete latest commit ${version.name}`}
                          className="commit-history-row__delete"
                          title="Delete latest commit"
                          variant="destructive"
                          size="icon-xs"
                          onClick={onDeleteLatest}
                        >
                          <Trash2 />
                        </IconButton>
                      )}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="commit-history-empty">No commits yet.</p>
          )}
        </PopoverContent>
      </Popover>
    </div>
  );
}
