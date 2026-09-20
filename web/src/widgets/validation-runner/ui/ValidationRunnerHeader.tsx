import { Group, Text } from '@mantine/core';
import { Play, Trash2 } from 'lucide-react';
import { Button, IconButton, Kbd } from '@/shared/ui';
import type { ValidationRunnerHeaderProps } from './ValidationRunner.types';

function getActionLabel(running: boolean) {
  if (running) return 'Running…';
  return 'Validate';
}

function getModifierLabel(usesCommandKey: boolean) {
  if (usesCommandKey) return '⌘';
  return 'Ctrl';
}

export function ValidationRunnerHeader({
  lines,
  onClear,
  onValidate,
  running,
  status,
  usesCommandKey,
}: ValidationRunnerHeaderProps) {
  const actionLabel = getActionLabel(running);
  const modifierLabel = getModifierLabel(usesCommandKey);
  const canClear = !running && lines.length > 0;

  return (
    <header className="validation-header">
      <Group gap={8} className="validation-title" aria-live="polite">
        <Text component="span" size="xs" fw={650}>
          Test runner
        </Text>
        <i className={`validation-dot validation-dot--${status}`} aria-hidden="true" />
        <span className="sr-only">{status}</span>
      </Group>

      <Group gap={8} className="validation-actions">
        <IconButton
          label="Clear test runner"
          className="clear-terminal-button"
          color="red"
          variant="ghost"
          size="icon-sm"
          onClick={onClear}
          disabled={!canClear}
        >
          <Trash2 size={15} />
        </IconButton>

        <Button
          className="validate-button"
          color="platformSignal"
          leftSection={!running && <Play size={14} aria-hidden="true" />}
          onClick={onValidate}
          disabled={running}
        >
          <span>{actionLabel}</span>
          <Group gap={3} className="validate-shortcut" ml={10}>
            <Kbd>{modifierLabel}</Kbd>
            <Kbd>↵</Kbd>
          </Group>
        </Button>
      </Group>
    </header>
  );
}
