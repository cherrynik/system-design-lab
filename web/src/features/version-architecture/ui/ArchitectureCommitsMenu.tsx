import { useEffect, useRef, useState } from 'react';
import { FiCheck, FiEdit2, FiGitBranch, FiTrash2 } from 'react-icons/fi';
import type { ArchitectureVersion } from '../../../entities/architecture';

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

export function ArchitectureCommitsMenu({ versions, dirty = false, open, onOpenChange, onCommit, onRestore, onRename, onDeleteLatest }: Props) {
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const commitButtonRef = useRef<HTMLButtonElement>(null);
  const renameCancelledRef = useRef(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState('');

  useEffect(() => {
    if (open) commitButtonRef.current?.focus();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const closeOnOutsidePointer = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) onOpenChange(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' || editingId) return;
      event.preventDefault();
      event.stopPropagation();
      onOpenChange(false);
      window.requestAnimationFrame(() => triggerRef.current?.focus());
    };
    document.addEventListener('pointerdown', closeOnOutsidePointer);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('pointerdown', closeOnOutsidePointer);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [editingId, open, onOpenChange]);

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

  return <div className="architecture-commits" ref={rootRef}>
    <button
      ref={triggerRef}
      className={`commits-trigger ${open ? 'commits-trigger--active' : ''}`}
      type="button"
      aria-label={dirty ? 'Architecture commits — uncommitted changes' : 'Architecture commits'}
      aria-expanded={open}
      aria-haspopup="dialog"
      title="Architecture commits"
      onClick={() => onOpenChange(!open)}
    >
      <FiGitBranch />
      {dirty && <span className="commits-trigger__dirty" aria-hidden="true" />}
    </button>
    {open && <div className="commits-popover" role="dialog" aria-label="Architecture commits">
      <header>
        <span className="commits-popover__title"><FiGitBranch /><span className="panel-id">COMMITS</span></span>
        <button ref={commitButtonRef} className="commit-current-button" type="button" aria-label="Commit" onClick={onCommit}>Commit</button>
      </header>
      {versions.length ? <div className="commit-history">
        {versions.map((version, index) => {
          const isEditing = editingId === version.id;
          const isLatest = index === 0;
          return <div className="commit-history-row" key={version.id}>
          <code>{shortHash(version.id)}</code>
          {isEditing ? <input
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
          /> : <button className="commit-history-row__restore" type="button" onClick={() => onRestore(version)}>
            <strong>{version.name}</strong>
            <small>{new Date(version.createdAt).toLocaleString()}</small>
          </button>}
          <span className="commit-history-row__actions">
            <button
              className={`commit-history-row__rename ${isEditing ? 'commit-history-row__rename--done' : ''}`}
              type="button"
              aria-label={isEditing ? `Finish renaming ${version.name}` : `Rename ${version.name}`}
              title={isEditing ? 'Done' : 'Rename commit'}
              onPointerDown={isEditing ? (event) => event.preventDefault() : undefined}
              onClick={() => isEditing ? finishRename() : beginRename(version)}
            >
              {isEditing ? <FiCheck /> : <FiEdit2 />}
            </button>
            {isLatest && !isEditing && <button
              className="commit-history-row__delete"
              type="button"
              aria-label={`Delete latest commit ${version.name}`}
              title="Delete latest commit"
              onClick={onDeleteLatest}
            ><FiTrash2 /></button>}
          </span>
        </div>})}
      </div> : <p className="commit-history-empty">No commits yet.</p>}
    </div>}
  </div>;
}
