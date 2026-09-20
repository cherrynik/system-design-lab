import { useEffect, useRef, useState } from 'react';
import { Divider, Group, Indicator, Stack, Text } from '@mantine/core';
import { GitBranch } from 'lucide-react';
import type { ArchitectureVersion } from '@/entities/architecture';
import {
  Button,
  IconButton,
  Popover,
  PopoverContent,
  PopoverTrigger,
  ScrollArea,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/shared/ui';
import { ArchitectureCommitRow } from './ArchitectureCommitRow';
import type { ArchitectureCommitsMenuProps } from './ArchitectureCommitsMenu.types';

export function ArchitectureCommitsMenu({
  versions,
  dirty = false,
  open,
  onOpenChange,
  onCommit,
  onRestore,
  onRename,
  onDeleteLatest,
}: ArchitectureCommitsMenuProps) {
  const commitButtonRef = useRef<HTMLButtonElement>(null);
  const triggerButtonRef = useRef<HTMLButtonElement>(null);
  const renameCancelledRef = useRef(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const triggerLabel = dirty
    ? 'Architecture commits — uncommitted changes'
    : 'Architecture commits';
  const hasVersions = versions.length > 0;
  const triggerVariant = open ? 'secondary' : 'ghost';

  useEffect(() => {
    if (open) commitButtonRef.current?.focus();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' || editingId) return;
      event.preventDefault();
      onOpenChange(false);
      window.setTimeout(() => triggerButtonRef.current?.focus(), 0);
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [editingId, onOpenChange, open, triggerLabel]);

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

  const cancelRename = () => {
    renameCancelledRef.current = true;
  };

  return (
    <div className="architecture-commits">
      <Popover open={open} onOpenChange={onOpenChange} shadow="xl" closeOnEscape={false}>
        <PopoverTrigger>
          <Tooltip>
            <TooltipTrigger
              render={
                <IconButton
                  label={triggerLabel}
                  ref={triggerButtonRef}
                  aria-haspopup="dialog"
                  aria-expanded={open}
                  className="commits-trigger"
                  variant={triggerVariant}
                  color="gray"
                  size="icon"
                  onClick={() => onOpenChange(!open)}
                />
              }
            >
              <Indicator color="yellow" size={7} disabled={!dirty} offset={5} inline>
                <GitBranch size={17} />
              </Indicator>
            </TooltipTrigger>
            <TooltipContent>{triggerLabel}</TooltipContent>
          </Tooltip>
        </PopoverTrigger>

        <PopoverContent
          className="commits-popover"
          role="dialog"
          aria-label="COMMITS"
          side="bottom"
          align="end"
          sideOffset={8}
        >
          <Group justify="space-between" gap="md" p="sm">
            <Group gap={7}>
              <GitBranch size={15} />
              <Text component="h2" size="xs" fw={650}>
                Commits
              </Text>
            </Group>
            <Button
              ref={commitButtonRef}
              autoFocus
              className="commit-current-button"
              size="xs"
              variant="secondary"
              color="platformSignal"
              onClick={onCommit}
            >
              Commit
            </Button>
          </Group>

          <Divider />

          {hasVersions && (
            <ScrollArea autosize mah={320} type="auto">
              <Stack className="commit-history" gap={2} p="xs">
                {versions.map((version, index) => {
                  const isEditing = editingId === version.id;
                  const isLatest = index === 0;
                  return (
                    <ArchitectureCommitRow
                      key={version.id}
                      version={version}
                      editing={isEditing}
                      latest={isLatest}
                      draft={draft}
                      onDraftChange={setDraft}
                      onBeginRename={beginRename}
                      onFinishRename={finishRename}
                      onCancelRename={cancelRename}
                      onRestore={onRestore}
                      onDeleteLatest={onDeleteLatest}
                    />
                  );
                })}
              </Stack>
            </ScrollArea>
          )}

          {!hasVersions && (
            <Text className="commit-history-empty" size="sm" c="dimmed" p="md">
              No commits yet.
            </Text>
          )}
        </PopoverContent>
      </Popover>
    </div>
  );
}
