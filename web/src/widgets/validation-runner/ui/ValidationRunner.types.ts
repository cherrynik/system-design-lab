import type { RefObject } from 'react';
import type { ValidationAttempt, ValidationTerminalLine } from '@/features/validate-architecture';

export type ValidationRunnerStatus = 'idle' | 'running' | 'ready' | 'warning' | 'error';

export type ValidationRunnerProps = {
  error: string | null;
  lines: ValidationTerminalLine[];
  running: boolean;
  status: ValidationRunnerStatus;
  usesCommandKey: boolean;
  outputRef: RefObject<HTMLDivElement | null>;
  onClear: () => void;
  onValidate: () => void;
  liveChecks?: boolean;
  liveIssueCount?: number;
  onLiveChecksChange?: (enabled: boolean) => void;
  attempts?: readonly ValidationAttempt[];
  selectedAttemptId?: number | null;
  onSelectAttempt?: (id: number) => void;
  currentAttemptSelected?: boolean;
  onSelectCurrentAttempt?: () => void;
};

export type ValidationRunnerHeaderProps = Pick<
  ValidationRunnerProps,
  'lines' | 'onClear' | 'onValidate' | 'running' | 'status' | 'usesCommandKey'
>;

export type ValidationRunnerOutputProps = Pick<
  ValidationRunnerProps,
  'error' | 'lines' | 'outputRef'
>;

export type ValidationTerminalRowProps = {
  line: ValidationTerminalLine;
  index: number;
};
