import type { ArchitectureSnapshot } from '../../../entities/architecture';
import type { ArchitectureHistoryState } from './architectureHistory.types';

const HISTORY_LIMIT = 100;

export type { ArchitectureHistoryState } from './architectureHistory.types';

const withoutSelection = ({ nodes, edges }: ArchitectureSnapshot) => ({
  nodes: nodes.map(({ selected: _selected, ...node }) => node),
  edges: edges.map(({ selected: _selected, ...edge }) => edge),
});

export function architectureSnapshotsMatch(
  left: ArchitectureSnapshot,
  right: ArchitectureSnapshot,
) {
  return JSON.stringify(withoutSelection(left)) === JSON.stringify(withoutSelection(right));
}

export function createArchitectureHistory(present: ArchitectureSnapshot): ArchitectureHistoryState {
  return { present, past: [], future: [] };
}

export function pushArchitectureHistory(
  state: ArchitectureHistoryState,
  present: ArchitectureSnapshot,
): ArchitectureHistoryState {
  if (architectureSnapshotsMatch(state.present, present)) {
    return state.present === present ? state : { ...state, present };
  }

  return {
    present,
    past: [...state.past, state.present].slice(-HISTORY_LIMIT),
    future: [],
  };
}

export function replaceArchitecturePresent(
  state: ArchitectureHistoryState,
  present: ArchitectureSnapshot,
): ArchitectureHistoryState {
  return state.present === present ? state : { ...state, present };
}

export function undoArchitectureHistory(state: ArchitectureHistoryState): ArchitectureHistoryState {
  const previous = state.past.at(-1);
  if (!previous) return state;

  return {
    present: previous,
    past: state.past.slice(0, -1),
    future: [state.present, ...state.future],
  };
}

export function redoArchitectureHistory(state: ArchitectureHistoryState): ArchitectureHistoryState {
  const next = state.future[0];
  if (!next) return state;

  return {
    present: next,
    past: [...state.past, state.present].slice(-HISTORY_LIMIT),
    future: state.future.slice(1),
  };
}

export function isEditableShortcutTarget(target: EventTarget | null) {
  return (
    target instanceof Element &&
    Boolean(
      target.closest(
        'input, textarea, select, [contenteditable]:not([contenteditable="false"]), [role="textbox"]',
      ),
    )
  );
}

export function getArchitectureHistoryShortcut(
  event: Pick<KeyboardEvent, 'key' | 'metaKey' | 'ctrlKey' | 'shiftKey' | 'altKey'>,
): 'undo' | 'redo' | null {
  if ((!event.metaKey && !event.ctrlKey) || event.altKey) return null;
  const key = event.key.toLowerCase();
  if (key === 'z') return event.shiftKey ? 'redo' : 'undo';
  if (key === 'y' && !event.shiftKey) return 'redo';
  return null;
}
