import { Group, Stack, Text } from '@mantine/core';
import { Check, Pencil, Trash2 } from 'lucide-react';
import type { KeyboardEvent } from 'react';
import { Button, IconButton, Input, Tooltip, TooltipContent, TooltipTrigger } from '@/shared/ui';
import type { ArchitectureCommitRowProps } from './ArchitectureCommitsMenu.types';

function getShortHash(id: string) {
  return id.replaceAll('-', '').slice(0, 7);
}

export function ArchitectureCommitRow({
  version,
  editing,
  latest,
  draft,
  onDraftChange,
  onBeginRename,
  onFinishRename,
  onCancelRename,
  onRestore,
  onDeleteLatest,
}: ArchitectureCommitRowProps) {
  const renameLabel = editing ? `Finish renaming ${version.name}` : `Rename ${version.name}`;
  const renameTitle = editing ? 'Done' : 'Rename commit';
  const RenameIcon = editing ? Check : Pencil;

  const handleRenameAction = () => {
    if (editing) {
      onFinishRename();
      return;
    }
    onBeginRename(version);
  };

  const handleRenameKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') event.currentTarget.blur();
    if (event.key !== 'Escape') return;
    event.stopPropagation();
    onCancelRename();
    event.currentTarget.blur();
  };

  return (
    <Group className="commit-history-row" gap={10} wrap="nowrap" align="center">
      <code className="commit-history-row__hash">{getShortHash(version.id)}</code>

      <div className="commit-history-row__content">
        {editing && (
          <Input
            autoFocus
            value={draft}
            aria-label={`Rename ${version.name}`}
            onChange={(event) => onDraftChange(event.currentTarget.value)}
            onBlur={onFinishRename}
            onKeyDown={handleRenameKeyDown}
            size="xs"
          />
        )}

        {!editing && (
          <Button
            className="commit-history-row__restore"
            variant="ghost"
            color="gray"
            fullWidth
            justify="flex-start"
            onClick={() => onRestore(version)}
          >
            <Stack gap={1} align="flex-start">
              <Text component="strong" size="sm" fw={600}>
                {version.name}
              </Text>
              <Text component="span" size="xs" c="dimmed">
                {new Date(version.createdAt).toLocaleString()}
              </Text>
            </Stack>
          </Button>
        )}
      </div>

      <Group className="commit-history-row__actions" gap={2} wrap="nowrap">
        <Tooltip>
          <TooltipTrigger
            render={
              <IconButton
                label={renameLabel}
                variant="ghost"
                color="gray"
                size="icon-xs"
                onPointerDown={(event) => {
                  if (editing) event.preventDefault();
                }}
                onClick={handleRenameAction}
              />
            }
          >
            <RenameIcon size={14} />
          </TooltipTrigger>
          <TooltipContent>{renameTitle}</TooltipContent>
        </Tooltip>

        {latest && !editing && (
          <Tooltip>
            <TooltipTrigger
              render={
                <IconButton
                  label={`Delete latest commit ${version.name}`}
                  variant="ghost"
                  color="red"
                  size="icon-xs"
                  onClick={onDeleteLatest}
                />
              }
            >
              <Trash2 size={14} />
            </TooltipTrigger>
            <TooltipContent>Delete latest commit</TooltipContent>
          </Tooltip>
        )}
      </Group>
    </Group>
  );
}
